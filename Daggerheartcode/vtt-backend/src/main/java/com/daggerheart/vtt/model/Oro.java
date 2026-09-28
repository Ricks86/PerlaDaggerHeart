package com.daggerheart.vtt.model;

import jakarta.persistence.Embeddable;

/**
 * Representación del oro en Daggerheart (sistema de 3 denominaciones).
 * Embebido directamente en PlayerCharacter.
 */
@Embeddable
public class Oro {

    private int punados;
    private int sacos;
    private int cofres;

    public Oro() {}

    public Oro(int punados, int sacos, int cofres) {
        this.punados = punados;
        this.sacos = sacos;
        this.cofres = cofres;
    }

    public int getPunados()  { return punados; }
    public void setPunados(int punados)  { this.punados = punados; }

    public int getSacos()    { return sacos; }
    public void setSacos(int sacos)      { this.sacos = sacos; }

    public int getCofres()   { return cofres; }
    public void setCofres(int cofres)    { this.cofres = cofres; }
}
