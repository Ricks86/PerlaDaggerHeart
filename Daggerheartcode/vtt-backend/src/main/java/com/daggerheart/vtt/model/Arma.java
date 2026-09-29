package com.daggerheart.vtt.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Subclase Arma: armas principales o secundarias de combate.
 */
@Entity
@Table(name = "item_arma")
public class Arma extends Item {

    /** "Principal" o "Secundaria" */
    private String categoria;

    private String rasgo;

    /** "d4", "d6", "d8", "d10", "d12" */
    private String dadoBase;

    private int modificadorDano;

    /** "físico" o "mágico" */
    private String tipoDano;

    /** Carga / Manos requeridas: 1 o 2 */
    private int carga = 1;

    /** "Cuerpo a cuerpo", "Cercano", "Lejano" */
    private String alcance;

    public Arma() {
        super();
    }

    public Arma(String nombre, int tier, String categoria, String rasgo, String dadoBase,
                int modificadorDano, String tipoDano, int carga, String alcance) {
        super(nombre, tier);
        this.categoria = categoria;
        this.rasgo = rasgo;
        this.dadoBase = dadoBase;
        this.modificadorDano = modificadorDano;
        this.tipoDano = tipoDano;
        this.carga = carga;
        this.alcance = alcance;
    }

    @Override
    public String getTipo() {
        return "Arma";
    }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getRasgo() { return rasgo; }
    public void setRasgo(String rasgo) { this.rasgo = rasgo; }

    public String getDadoBase() { return dadoBase; }
    public void setDadoBase(String dadoBase) { this.dadoBase = dadoBase; }

    public int getModificadorDano() { return modificadorDano; }
    public void setModificadorDano(int modificadorDano) { this.modificadorDano = modificadorDano; }

    public String getTipoDano() { return tipoDano; }
    public void setTipoDano(String tipoDano) { this.tipoDano = tipoDano; }

    public int getCarga() { return carga; }
    public void setCarga(int carga) { this.carga = carga; }

    public String getAlcance() { return alcance; }
    public void setAlcance(String alcance) { this.alcance = alcance; }
}
