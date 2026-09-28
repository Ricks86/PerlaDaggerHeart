package com.daggerheart.vtt.controller;

import com.daggerheart.vtt.dto.TableAction;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

/**
 * Controlador WebSocket para la mesa de juego compartida.
 *
 * Actúa como relay: recibe una acción de cualquier cliente y la
 * retransmite a TODOS los clientes suscritos a /topic/table.
 *
 * Flujo completo:
 *   Cliente envía → /app/action
 *   Spring enruta → handleTableAction()
 *   Retorno publicado → /topic/table
 *   Todos los clientes suscritos → reciben el mensaje
 */
@Controller
public class TableController {

    /**
     * Recibe cualquier TableAction y la retransmite a todos los jugadores.
     * El relay es transparente: no modifica el contenido del mensaje.
     *
     * @param action La acción recibida desde cualquier cliente
     * @return La misma acción, broadcast a /topic/table
     */
    @MessageMapping("/action")
    @SendTo("/topic/table")
    public TableAction handleTableAction(TableAction action) {
        // Log en consola del servidor para debugging durante desarrollo
        System.out.printf("[VTT] Acción recibida → tipo: %s | jugador: %s | payload: %s%n",
                action.getType(), action.getPlayer(), action.getPayload());
        return action;
    }
}
