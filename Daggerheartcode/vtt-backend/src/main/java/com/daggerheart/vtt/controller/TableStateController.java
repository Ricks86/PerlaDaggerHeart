package com.daggerheart.vtt.controller;

import com.daggerheart.vtt.dto.CreateCountdownRequest;
import com.daggerheart.vtt.dto.FearAdjustmentRequest;
import com.daggerheart.vtt.dto.UpdateCountdownRequest;
import com.daggerheart.vtt.model.Countdown;
import com.daggerheart.vtt.model.TableState;
import com.daggerheart.vtt.service.TableStateService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Controlador REST para la gestión del estado global de la mesa:
 * Reserva de Miedo (Fear Pool) y Relojes de Cuenta Atrás (Countdowns).
 */
@RestController
@RequestMapping("/api/table-state")
@CrossOrigin(origins = "*")
public class TableStateController {

    private final TableStateService tableStateService;

    public TableStateController(TableStateService tableStateService) {
        this.tableStateService = tableStateService;
    }

    /**
     * GET /api/table-state:
     * Devuelve el estado actual de la mesa (fearPool y countdowns).
     */
    @GetMapping
    public ResponseEntity<TableState> getTableState() {
        return ResponseEntity.ok(tableStateService.getTableState());
    }

    /**
     * PATCH /api/table-state/fear:
     * Ajusta o gasta puntos de la Reserva de Miedo.
     */
    @PatchMapping("/fear")
    public ResponseEntity<TableState> adjustFear(@RequestBody FearAdjustmentRequest request) {
        TableState updated = tableStateService.spendOrAdjustFear(
                request.getDelta(),
                request.getValue(),
                request.getMotivo(),
                request.getSilent()
        );
        return ResponseEntity.ok(updated);
    }

    /**
     * POST /api/table-state/countdowns:
     * Crea un nuevo reloj de cuenta atrás.
     */
    @PostMapping("/countdowns")
    public ResponseEntity<Countdown> createCountdown(@RequestBody CreateCountdownRequest request) {
        if (request.getNombre() == null || request.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del reloj no puede estar vacío.");
        }
        int max = request.getValorMaximo() != null ? request.getValorMaximo() : 4;
        Countdown created = tableStateService.createCountdown(
                request.getNombre().trim(),
                max,
                request.getValorActual(),
                request.getVisibleParaJugadores()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PATCH /api/table-state/countdowns/{id}:
     * Modifica el progreso o visibilidad de un reloj existente.
     */
    @PatchMapping("/countdowns/{id}")
    public ResponseEntity<Countdown> updateCountdown(@PathVariable Long id,
                                                    @RequestBody UpdateCountdownRequest request) {
        Countdown updated = tableStateService.updateCountdown(
                id,
                request.getDelta(),
                request.getValorActual(),
                request.getVisibleParaJugadores()
        );
        return ResponseEntity.ok(updated);
    }

    /**
     * POST /api/table-state/countdowns/{id}/announce:
     * Anuncia manualmente la activación del reloj en el Historial de Mesa.
     */
    @PostMapping("/countdowns/{id}/announce")
    public ResponseEntity<Countdown> announceCountdown(@PathVariable Long id) {
        Countdown announced = tableStateService.announceCountdown(id);
        return ResponseEntity.ok(announced);
    }

    /**
     * DELETE /api/table-state/countdowns/{id}:
     * Elimina el reloj de cuenta atrás.
     */
    @DeleteMapping("/countdowns/{id}")
    public ResponseEntity<Void> deleteCountdown(@PathVariable Long id) {
        tableStateService.deleteCountdown(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }
}
