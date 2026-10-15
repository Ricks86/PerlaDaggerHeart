package com.daggerheart.vtt.service;

import com.daggerheart.vtt.dto.TableAction;
import com.daggerheart.vtt.model.Countdown;
import com.daggerheart.vtt.model.TableState;
import com.daggerheart.vtt.repository.TableStateRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Servicio de gestión de TableState:
 * Maneja la Reserva de Miedo (Fear Pool) del DJ y los Relojes de Cuenta Atrás (Countdowns),
 * sincronizándolos en tiempo real con WebSocket (/topic/table-state y /topic/table).
 */
@Service
@Transactional
public class TableStateService {

    private final TableStateRepository tableStateRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public TableStateService(TableStateRepository tableStateRepository,
                             SimpMessagingTemplate messagingTemplate) {
        this.tableStateRepository = tableStateRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Obtiene o inicializa el TableState único de la sesión (id = 1L).
     */
    public TableState getTableState() {
        return tableStateRepository.findById(1L).orElseGet(() -> {
            TableState initial = new TableState(1L, 0, new ArrayList<>());
            return tableStateRepository.save(initial);
        });
    }

    /**
     * Incrementa automáticamente la Reserva de Miedo en +1 cuando un jugador
     * realiza una tirada Duality Con Miedo (fearDie > hopeDie).
     */
    public TableState incrementFearOnDualityRoll() {
        TableState state = getTableState();
        state.setFearPool(state.getFearPool() + 1);
        TableState saved = tableStateRepository.save(state);
        messagingTemplate.convertAndSend("/topic/table-state", saved);
        return saved;
    }

    /**
     * Permite al DJ gastar o ajustar la Reserva de Miedo.
     * Si delta < 0 (gasto de Miedo):
     *  - Calcula la cantidad gastada.
     *  - Emite un evento FEAR_SPENT a /topic/table para el Historial de Mesa (a menos que silent = true).
     */
    public TableState spendOrAdjustFear(Integer delta, Integer value, String motivo) {
        return spendOrAdjustFear(delta, value, motivo, false);
    }

    public TableState spendOrAdjustFear(Integer delta, Integer value, String motivo, Boolean silent) {
        TableState state = getTableState();

        if (value != null) {
            state.setFearPool(Math.max(0, value));
        }

        if (delta != null) {
            if (delta < 0) {
                int cantidadGastada = Math.abs(delta);
                int nuevoTotal = Math.max(0, state.getFearPool() + delta);
                state.setFearPool(nuevoTotal);

                // Emisión de evento al Historial de Mesa (solo si NO es silencioso)
                if (!Boolean.TRUE.equals(silent)) {
                    String trimmedMotivo = (motivo != null && !motivo.trim().isEmpty()) ? " — " + motivo.trim() : "";
                    String mensaje = String.format("🔥 El Dungeon Master ha gastado %d de Miedo. (Reserva restante: %d)%s",
                            cantidadGastada, nuevoTotal, trimmedMotivo);

                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("cantidadGastada", cantidadGastada);
                    payload.put("nuevoTotal", nuevoTotal);
                    payload.put("motivo", motivo != null ? motivo.trim() : "");
                    payload.put("mensaje", mensaje);

                    TableAction action = new TableAction("FEAR_SPENT", "Dungeon Master", payload);
                    messagingTemplate.convertAndSend("/topic/table", action);
                }
            } else if (delta > 0) {
                state.setFearPool(state.getFearPool() + delta);
            }
        }

        TableState saved = tableStateRepository.save(state);
        messagingTemplate.convertAndSend("/topic/table-state", saved);
        return saved;
    }

    /**
     * Crea un nuevo reloj de cuenta atrás asociado a la mesa.
     */
    public Countdown createCountdown(String nombre, int valorMaximo, Integer valorActual, Boolean visibleParaJugadores) {
        TableState state = getTableState();
        int initialVal = valorActual != null ? valorActual : valorMaximo;
        boolean visible = visibleParaJugadores != null ? visibleParaJugadores : true;

        Countdown countdown = new Countdown(nombre, initialVal, valorMaximo, visible);
        state.getCountdowns().add(countdown);
        TableState saved = tableStateRepository.save(state);

        messagingTemplate.convertAndSend("/topic/table-state", saved);
        return saved.getCountdowns().get(saved.getCountdowns().size() - 1);
    }

    /**
     * Actualiza el valor o visibilidad de un reloj de cuenta atrás.
     * Si transiciona a 0 y es visible para jugadores, emite COUNTDOWN_TRIGGERED al Historial de Mesa.
     */
    public Countdown updateCountdown(Long countdownId, Integer delta, Integer valorActual, Boolean visibleParaJugadores) {
        TableState state = getTableState();

        Countdown cd = state.getCountdowns().stream()
                .filter(c -> Objects.equals(c.getId(), countdownId))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Reloj no encontrado con ID: " + countdownId));

        int valorAnterior = cd.getValorActual();

        if (visibleParaJugadores != null) {
            cd.setVisibleParaJugadores(visibleParaJugadores);
        }

        if (valorActual != null) {
            cd.setValorActual(valorActual);
        } else if (delta != null) {
            cd.setValorActual(cd.getValorActual() + delta);
        }

        int nuevoValor = cd.getValorActual();

        // Si acaba de llegar a 0
        if (valorAnterior > 0 && nuevoValor == 0) {
            if (cd.isVisibleParaJugadores()) {
                String mensaje = String.format("💥 ¡El reloj \"%s\" ha llegado a 0 y se ha activado!", cd.getNombre());
                Map<String, Object> payload = new LinkedHashMap<>();
                payload.put("countdownId", cd.getId());
                payload.put("nombre", cd.getNombre());
                payload.put("mensaje", mensaje);

                TableAction action = new TableAction("COUNTDOWN_TRIGGERED", "Sistema", payload);
                messagingTemplate.convertAndSend("/topic/table", action);
            }
        }

        TableState saved = tableStateRepository.save(state);
        messagingTemplate.convertAndSend("/topic/table-state", saved);

        return saved.getCountdowns().stream()
                .filter(c -> Objects.equals(c.getId(), countdownId))
                .findFirst()
                .orElse(cd);
    }

    /**
     * Permite al DJ anunciar manualmente en el chat la activación de un reloj (por ejemplo, si era secreto).
     */
    public Countdown announceCountdown(Long countdownId) {
        TableState state = getTableState();

        Countdown cd = state.getCountdowns().stream()
                .filter(c -> Objects.equals(c.getId(), countdownId))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Reloj no encontrado con ID: " + countdownId));

        String mensaje = String.format("💥 ¡El reloj \"%s\" ha llegado a 0 y se ha activado!", cd.getNombre());
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("countdownId", cd.getId());
        payload.put("nombre", cd.getNombre());
        payload.put("mensaje", mensaje);

        TableAction action = new TableAction("COUNTDOWN_TRIGGERED", "Dungeon Master", payload);
        messagingTemplate.convertAndSend("/topic/table", action);

        return cd;
    }

    /**
     * Elimina un reloj de cuenta atrás de la mesa.
     */
    public void deleteCountdown(Long countdownId) {
        TableState state = getTableState();
        boolean removed = state.getCountdowns().removeIf(c -> Objects.equals(c.getId(), countdownId));
        if (removed) {
            TableState saved = tableStateRepository.save(state);
            messagingTemplate.convertAndSend("/topic/table-state", saved);
        } else {
            throw new NoSuchElementException("Reloj no encontrado con ID: " + countdownId);
        }
    }
}
