package com.daggerheart.vtt;

import com.daggerheart.vtt.dto.TableAction;
import com.daggerheart.vtt.model.Countdown;
import com.daggerheart.vtt.model.TableState;
import com.daggerheart.vtt.repository.TableStateRepository;
import com.daggerheart.vtt.service.TableStateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para Sprint 28:
 * - Reserva de Miedo Global (Fear Pool).
 * - Relojes de Cuenta Atrás (Countdowns).
 * - Ganancia y gasto de Miedo con eventos en Historial de Mesa.
 * - Activación de cuenta atrás al llegar a 0.
 */
public class TableStateServiceTest {

    private TableStateRepository tableStateRepository;
    private SimpMessagingTemplate messagingTemplate;
    private TableStateService tableStateService;

    @BeforeEach
    public void setUp() {
        tableStateRepository = Mockito.mock(TableStateRepository.class);
        messagingTemplate = Mockito.mock(SimpMessagingTemplate.class);
        tableStateService = new TableStateService(tableStateRepository, messagingTemplate);
    }

    @Test
    public void testGetTableStateInitializesSingleton() {
        when(tableStateRepository.findById(1L)).thenReturn(Optional.empty());
        when(tableStateRepository.save(any(TableState.class))).thenAnswer(inv -> inv.getArgument(0));

        TableState state = tableStateService.getTableState();
        assertNotNull(state);
        assertEquals(1L, state.getId());
        assertEquals(0, state.getFearPool());
        assertTrue(state.getCountdowns().isEmpty());
    }

    @Test
    public void testIncrementFearOnDualityRoll() {
        TableState state = new TableState(1L, 3, new ArrayList<>());
        when(tableStateRepository.findById(1L)).thenReturn(Optional.of(state));
        when(tableStateRepository.save(any(TableState.class))).thenAnswer(inv -> inv.getArgument(0));

        TableState updated = tableStateService.incrementFearOnDualityRoll();
        assertEquals(4, updated.getFearPool());
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/table-state"), eq(updated));
    }

    @Test
    public void testSpendFearEmitsFearSpentAction() {
        TableState state = new TableState(1L, 6, new ArrayList<>());
        when(tableStateRepository.findById(1L)).thenReturn(Optional.of(state));
        when(tableStateRepository.save(any(TableState.class))).thenAnswer(inv -> inv.getArgument(0));

        TableState updated = tableStateService.spendOrAdjustFear(-2, null, "Invocación de Espectros");
        assertEquals(4, updated.getFearPool());

        ArgumentCaptor<TableAction> captor = ArgumentCaptor.forClass(TableAction.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/table"), captor.capture());

        TableAction sentAction = captor.getValue();
        assertEquals("FEAR_SPENT", sentAction.getType());
        assertEquals("Dungeon Master", sentAction.getPlayer());

        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) sentAction.getPayload();
        assertEquals(2, payload.get("cantidadGastada"));
        assertEquals(4, payload.get("nuevoTotal"));
        assertTrue(((String) payload.get("mensaje")).contains("Invocación de Espectros"));
    }

    @Test
    public void testSpendFearSilentlyDoesNotEmitToTable() {
        TableState state = new TableState(1L, 12, new ArrayList<>());
        when(tableStateRepository.findById(1L)).thenReturn(Optional.of(state));
        when(tableStateRepository.save(any(TableState.class))).thenAnswer(inv -> inv.getArgument(0));

        // Reducción silenciosa de 12 de golpe (limpieza)
        TableState updated = tableStateService.spendOrAdjustFear(-12, null, "", true);
        assertEquals(0, updated.getFearPool());

        // Debe emitir el nuevo estado a /topic/table-state pero NUNCA a /topic/table
        verify(messagingTemplate).convertAndSend(eq("/topic/table-state"), eq(updated));
        verify(messagingTemplate, never()).convertAndSend(eq("/topic/table"), any(TableAction.class));
    }

    @Test
    public void testCreateCountdown() {
        TableState state = new TableState(1L, 0, new ArrayList<>());
        when(tableStateRepository.findById(1L)).thenReturn(Optional.of(state));
        when(tableStateRepository.save(any(TableState.class))).thenAnswer(inv -> inv.getArgument(0));

        Countdown cd = tableStateService.createCountdown("Ritual de la Luna", 6, 6, true);
        assertNotNull(cd);
        assertEquals("Ritual de la Luna", cd.getNombre());
        assertEquals(6, cd.getValorActual());
        assertEquals(6, cd.getValorMaximo());
        assertTrue(cd.isVisibleParaJugadores());
        verify(messagingTemplate).convertAndSend(eq("/topic/table-state"), any(TableState.class));
    }

    @Test
    public void testUpdateCountdownTriggersExplosionWhenReachingZero() {
        Countdown cd = new Countdown("Refuerzos de la Guardia", 1, 4, true);
        cd.setId(10L);
        TableState state = new TableState(1L, 0, new ArrayList<>(java.util.List.of(cd)));

        when(tableStateRepository.findById(1L)).thenReturn(Optional.of(state));
        when(tableStateRepository.save(any(TableState.class))).thenAnswer(inv -> inv.getArgument(0));

        Countdown updated = tableStateService.updateCountdown(10L, -1, null, null);
        assertEquals(0, updated.getValorActual());

        ArgumentCaptor<TableAction> captor = ArgumentCaptor.forClass(TableAction.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/table"), captor.capture());

        TableAction sentAction = captor.getValue();
        assertEquals("COUNTDOWN_TRIGGERED", sentAction.getType());
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) sentAction.getPayload();
        assertEquals("Refuerzos de la Guardia", payload.get("nombre"));
        assertTrue(((String) payload.get("mensaje")).contains("ha llegado a 0 y se ha activado"));
    }

    @Test
    public void testHiddenCountdownDoesNotAutoTriggerToTableUntilAnnounced() {
        Countdown cd = new Countdown("Trampa Secreta", 1, 4, false);
        cd.setId(20L);
        TableState state = new TableState(1L, 0, new ArrayList<>(java.util.List.of(cd)));

        when(tableStateRepository.findById(1L)).thenReturn(Optional.of(state));
        when(tableStateRepository.save(any(TableState.class))).thenAnswer(inv -> inv.getArgument(0));

        // Actualizar a 0 -> No emite a /topic/table porque es oculto
        Countdown updated = tableStateService.updateCountdown(20L, -1, null, null);
        assertEquals(0, updated.getValorActual());
        verify(messagingTemplate, never()).convertAndSend(eq("/topic/table"), any(TableAction.class));

        // DJ pulsa "Anunciar" -> Emite a /topic/table
        tableStateService.announceCountdown(20L);
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/table"), any(TableAction.class));
    }

    @Test
    public void testDeleteCountdown() {
        Countdown cd = new Countdown("Fuga", 2, 4, true);
        cd.setId(30L);
        TableState state = new TableState(1L, 0, new ArrayList<>(java.util.List.of(cd)));

        when(tableStateRepository.findById(1L)).thenReturn(Optional.of(state));
        when(tableStateRepository.save(any(TableState.class))).thenAnswer(inv -> inv.getArgument(0));

        tableStateService.deleteCountdown(30L);
        assertTrue(state.getCountdowns().isEmpty());
        verify(messagingTemplate).convertAndSend(eq("/topic/table-state"), eq(state));
    }
}
