package com.daggerheart.vtt.model;

import jakarta.persistence.*;
import java.util.Arrays;
import java.util.List;

/**
 * Entidad Card: representa una carta en el compendio de Daggerheart.
 *
 * Puede ser de tipos:
 *   - 'Dominio'
 *   - 'Clase'
 *   - 'Subclase'
 *   - 'Linaje'
 *   - 'Comunidad'
 *   - 'Homebrew'
 *
 * El campo metadata guarda configuración adicional en formato JSON (String).
 * Ejemplo para 'Clase':
 *   {"evasion_base": 10, "hp_inicial": 6, "dominios": ["Gracia", "Medianoche"]}
 */
@Entity
@Table(name = "card")
public class Card {

    public static final List<String> VALID_TYPES = Arrays.asList(
        "Dominio", "Clase", "Subclase", "Linaje", "Comunidad", "Homebrew"
    );

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String titulo;

    /** Tipo de carta: Dominio, Clase, Subclase, Linaje, Comunidad, Homebrew */
    @Column(nullable = false)
    private String tipo;

    private int nivel;

    private boolean esHomebrew = false;

    /**
     * Descripción en Markdown para renderizar visualmente costes y habilidades.
     */
    @Column(columnDefinition = "TEXT")
    private String descripcion;

    /**
     * Metadatos específicos en formato JSON.
     * Crucial para Clases (ej: evasión base, hp inicial, dominios permitidos)
     * u otras configuraciones especiales.
     */
    @Column(columnDefinition = "TEXT")
    private String metadata;

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

    public Card(String titulo, String tipo, int nivel, String descripcion, String metadata) {
        this.titulo = titulo;
        this.tipo = tipo;
        this.nivel = nivel;
        this.descripcion = descripcion;
        this.metadata = metadata;
    }

    // -------------------------------------------------------------------------
    // Getters y Setters
    // -------------------------------------------------------------------------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public int getNivel() { return nivel; }
    public void setNivel(int nivel) { this.nivel = nivel; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public boolean isEsHomebrew() { return esHomebrew; }
    public void setEsHomebrew(boolean esHomebrew) { this.esHomebrew = esHomebrew; }

    @com.fasterxml.jackson.annotation.JsonSetter("metadata")
    public void setMetadataFromJson(com.fasterxml.jackson.databind.JsonNode node) {
        if (node == null || node.isNull()) {
            this.metadata = null;
        } else if (node.isTextual()) {
            this.metadata = node.asText();
        } else {
            this.metadata = node.toString();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Card card = (Card) o;
        if (id != null && card.id != null) {
            return id.equals(card.id);
        }
        return titulo != null && titulo.equals(card.titulo);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : (titulo != null ? titulo.hashCode() : 0);
    }
}
