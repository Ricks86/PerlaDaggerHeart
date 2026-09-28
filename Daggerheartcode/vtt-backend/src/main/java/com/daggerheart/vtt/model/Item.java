package com.daggerheart.vtt.model;

import jakarta.persistence.*;

/**
 * Entidad Item: arma, armadura o consumible del inventario.
 * Los campos opcionales (alcance, tipoDano, etc.) pueden ser null
 * dependiendo del tipo de ítem.
 */
@Entity
@Table(name = "item")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    /** "Arma", "Armadura" o "Consumible" */
    private String tipo;

    private String rasgo;

    /** Notación de dado: "d4", "d6", "d8", "d10", "d12" */
    private String dadoBase;

    private int modificadorDano;

    /** "físico" o "mágico" */
    private String tipoDano;

    /** Cuántos slots de inventario ocupa */
    private int carga;

    /** "Cuerpo a cuerpo", "Cercano", "Lejano" */
    private String alcance;

    @Column(columnDefinition = "TEXT")
    private String rasgoEspecial;

    // -------------------------------------------------------------------------
    // Constructores
    // -------------------------------------------------------------------------
    public Item() {}

    // -------------------------------------------------------------------------
    // Getters y Setters
    // -------------------------------------------------------------------------
    public Long getId() { return id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

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

    public String getRasgoEspecial() { return rasgoEspecial; }
    public void setRasgoEspecial(String rasgoEspecial) { this.rasgoEspecial = rasgoEspecial; }
}
