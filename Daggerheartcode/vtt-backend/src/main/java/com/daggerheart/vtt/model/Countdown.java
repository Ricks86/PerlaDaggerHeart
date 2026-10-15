package com.daggerheart.vtt.model;

import jakarta.persistence.*;

/**
 * Entidad Countdown (Reloj de Cuenta Atrás):
 * Representa un reloj de progresión o peligro asociado a la sesión de mesa activa.
 */
@Entity
@Table(name = "countdown")
public class Countdown {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private int valorActual;

    @Column(nullable = false)
    private int valorMaximo;

    @Column(nullable = false)
    private boolean visibleParaJugadores = true;

    public Countdown() {}

    public Countdown(String nombre, int valorActual, int valorMaximo, boolean visibleParaJugadores) {
        this.nombre = nombre;
        this.valorActual = Math.max(0, valorActual);
        this.valorMaximo = Math.max(1, valorMaximo);
        this.visibleParaJugadores = visibleParaJugadores;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public int getValorActual() {
        return valorActual;
    }

    public void setValorActual(int valorActual) {
        this.valorActual = Math.max(0, Math.min(valorActual, this.valorMaximo));
    }

    public int getValorMaximo() {
        return valorMaximo;
    }

    public void setValorMaximo(int valorMaximo) {
        this.valorMaximo = Math.max(1, valorMaximo);
        if (this.valorActual > this.valorMaximo) {
            this.valorActual = this.valorMaximo;
        }
    }

    public boolean isVisibleParaJugadores() {
        return visibleParaJugadores;
    }

    public void setVisibleParaJugadores(boolean visibleParaJugadores) {
        this.visibleParaJugadores = visibleParaJugadores;
    }
}
