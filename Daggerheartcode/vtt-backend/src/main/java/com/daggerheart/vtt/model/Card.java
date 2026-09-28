package com.daggerheart.vtt.model;

import jakarta.persistence.*;

/**
 * Entidad Card: representa una carta de dominio, ancestro u otro tipo.
 * La descripcion es un texto largo que soporta Markdown para renderizar
 * visualmente los costes (ej: **Gasta 1 Esperanza**).
 */
@Entity
@Table(name = "card")
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    /** Dominio, Ancestro, Comunidad, etc. */
    private String tipo;

    private int nivel;

    /**
     * Descripción en Markdown. Usamos @Lob para columnas de texto largo.
     * Ejemplo: "**Acción:** Gasta **1 Esperanza** para..."
     */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String descripcion;

    // -------------------------------------------------------------------------
    // Constructores
    // -------------------------------------------------------------------------
    public Card() {}

    public Card(String titulo, String tipo, int nivel, String descripcion) {
        this.titulo = titulo;
        this.tipo = tipo;
        this.nivel = nivel;
        this.descripcion = descripcion;
    }

    // -------------------------------------------------------------------------
    // Getters y Setters
    // -------------------------------------------------------------------------
    public Long getId() { return id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public int getNivel() { return nivel; }
    public void setNivel(int nivel) { this.nivel = nivel; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
}
