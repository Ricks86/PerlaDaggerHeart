package com.daggerheart.vtt.model;

import jakarta.persistence.Embeddable;

/**
 * Atributos base del personaje (embebidos en PlayerCharacter).
 * Cada valor representa el modificador numérico del atributo.
 */
@Embeddable
public class Atributos {

    private int agilidad;
    private int fuerza;
    private int sutileza;
    private int instinto;
    private int presencia;
    private int conocimiento;

    public Atributos() {}

    public Atributos(int agilidad, int fuerza, int sutileza,
                     int instinto, int presencia, int conocimiento) {
        this.agilidad = agilidad;
        this.fuerza = fuerza;
        this.sutileza = sutileza;
        this.instinto = instinto;
        this.presencia = presencia;
        this.conocimiento = conocimiento;
    }

    public int getAgilidad()    { return agilidad; }
    public void setAgilidad(int agilidad) { this.agilidad = agilidad; }

    public int getFuerza()      { return fuerza; }
    public void setFuerza(int fuerza) { this.fuerza = fuerza; }

    public int getSutileza()    { return sutileza; }
    public void setSutileza(int sutileza) { this.sutileza = sutileza; }

    public int getInstinto()    { return instinto; }
    public void setInstinto(int instinto) { this.instinto = instinto; }

    public int getPresencia()   { return presencia; }
    public void setPresencia(int presencia) { this.presencia = presencia; }

    public int getConocimiento() { return conocimiento; }
    public void setConocimiento(int conocimiento) { this.conocimiento = conocimiento; }
}
