package com.daggerheart.vtt.dto;

/**
 * DTO para la creación de un nuevo reloj de cuenta atrás.
 */
public class CreateCountdownRequest {

    private String nombre;
    private Integer valorMaximo;
    private Integer valorActual;
    private Boolean visibleParaJugadores;

    public CreateCountdownRequest() {}

    public CreateCountdownRequest(String nombre, Integer valorMaximo, Integer valorActual, Boolean visibleParaJugadores) {
        this.nombre = nombre;
        this.valorMaximo = valorMaximo;
        this.valorActual = valorActual;
        this.visibleParaJugadores = visibleParaJugadores;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Integer getValorMaximo() {
        return valorMaximo;
    }

    public void setValorMaximo(Integer valorMaximo) {
        this.valorMaximo = valorMaximo;
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
