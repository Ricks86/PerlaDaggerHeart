package com.daggerheart.vtt.model;

import jakarta.persistence.Embeddable;

/**
 * Una entrada de experiencia del personaje (embebible en colección).
 * Representa una habilidad narrativa con su nivel de valor.
 *
 * Ejemplo: "Rastreador del bosque" → valor 2
 */
@Embeddable
public class Experiencia {

    private String nombre;
    private int valor;

    public Experiencia() {}

    public Experiencia(String nombre, int valor) {
        this.nombre = nombre;
        this.valor = valor;
    }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public int getValor() { return valor; }
    public void setValor(int valor) { this.valor = valor; }
}
