package com.daggerheart.vtt.dto;

/**
 * DTO para la actualización de un reloj de cuenta atrás existente.
 */
public class UpdateCountdownRequest {

    private Integer delta;
    private Integer valorActual;
    private Boolean visibleParaJugadores;

    public UpdateCountdownRequest() {}

    public UpdateCountdownRequest(Integer delta, Integer valorActual, Boolean visibleParaJugadores) {
        this.delta = delta;
        this.valorActual = valorActual;
        this.visibleParaJugadores = visibleParaJugadores;
    }

    public Integer getDelta() {
        return delta;
    }

    public void setDelta(Integer delta) {
        this.delta = delta;
    }

    public Integer getValorActual() {
        return valorActual;
    }

    public void setValorActual(Integer valorActual) {
        this.valorActual = valorActual;
    }

    public Boolean getVisibleParaJugadores() {
        return visibleParaJugadores;
    }

    public void setVisibleParaJugadores(Boolean visibleParaJugadores) {
        this.visibleParaJugadores = visibleParaJugadores;
    }
}
