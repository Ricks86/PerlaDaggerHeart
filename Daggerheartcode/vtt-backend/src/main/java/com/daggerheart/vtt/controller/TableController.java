package com.daggerheart.vtt.controller;

import com.daggerheart.vtt.dto.TableAction;
import com.daggerheart.vtt.model.TableState;
import com.daggerheart.vtt.service.TableStateService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

/**
 * Controlador WebSocket para la mesa de juego compartida.
 *
 * Actúa como relay y motor reactivo:
 *  - Intercepta tiradas Duality de los jugadores con resultado "Con Miedo" (fearDie > hopeDie)
 *    para incrementar automáticamente la Reserva de Miedo del DJ y añadir la notificación al Historial.
 *  - Retransmite la acción a todos los clientes suscritos a /topic/table.
 */
@Controller
public class TableController {

    private final TableStateService tableStateService;

    public TableController(TableStateService tableStateService) {
        this.tableStateService = tableStateService;
    }

    /**
     * Recibe cualquier TableAction, procesa automatizaciones de juego y la retransmite a la mesa.
     *
     * @param action La acción recibida desde cualquier cliente
     * @return La acción enriquecida, broadcast a /topic/table
     */
    @MessageMapping("/action")
    @SendTo("/topic/table")
    public TableAction handleTableAction(TableAction action) {
        if (action != null && "ROLL".equals(action.getType()) && action.getPayload() instanceof Map<?, ?> rawMap) {
            Object rollType = rawMap.get("type");
            if ("DUALITY".equals(rollType)) {
                Object hopeObj = rawMap.get("hopeRoll");
                Object fearObj = rawMap.get("fearRoll");
                if (hopeObj instanceof Number hopeNum && fearObj instanceof Number fearNum) {
                    int hopeRoll = hopeNum.intValue();
                    int fearRoll = fearNum.intValue();

                    // Regla de Negocio: Con Miedo (fearRoll > hopeRoll)
                    if (fearRoll > hopeRoll) {
                        TableState updatedState = tableStateService.incrementFearOnDualityRoll();

                        @SuppressWarnings("unchecked")
                        Map<String, Object> modifiableMap = new HashMap<>((Map<String, Object>) rawMap);
                        String fearNotice = String.format("💀 El DJ gana +1 de Miedo (Total: %d)", updatedState.getFearPool());
                        modifiableMap.put("fearNotice", fearNotice);

                        Object currentResult = modifiableMap.get("result");
                        if (currentResult instanceof String resStr) {
                            modifiableMap.put("result", resStr + " — " + fearNotice);
                        }
                        action.setPayload(modifiableMap);
                    }
                }
            }
        }

        System.out.printf("[VTT] Acción retransmitida → tipo: %s | jugador: %s | payload: %s%n",
                action != null ? action.getType() : "null",
                action != null ? action.getPlayer() : "null",
                action != null ? action.getPayload() : "null");

        return action;
    }
}
