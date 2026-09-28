package com.daggerheart.vtt.dto;

/**
 * DTO que representa cualquier acción enviada a la mesa virtual.
 * Actúa como mensaje genérico entre todos los clientes conectados.
 *
 * Campos:
 *  - type:    Identificador de la acción (ej: "ROLL", "CARD_PLAY", "HP_UPDATE")
 *  - player:  Nombre del jugador o DJ que origina la acción
 *  - payload: Datos dinámicos de la acción (resultado de dado, carta, etc.)
 */
public class TableAction {

    private String type;
    private String player;
    private Object payload;

    // -------------------------------------------------------------------------
    // Constructores
    // -------------------------------------------------------------------------

    /** Constructor vacío requerido por Jackson para deserialización JSON */
    public TableAction() {}

    public TableAction(String type, String player, Object payload) {
        this.type = type;
        this.player = player;
        this.payload = payload;
    }

    // -------------------------------------------------------------------------
    // Getters y Setters
    // -------------------------------------------------------------------------

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getPlayer() {
        return player;
    }

    public void setPlayer(String player) {
        this.player = player;
    }

    public Object getPayload() {
        return payload;
    }

    public void setPayload(Object payload) {
        this.payload = payload;
    }

    @Override
    public String toString() {
        return "TableAction{type='" + type + "', player='" + player + "', payload=" + payload + "}";
    }
}
