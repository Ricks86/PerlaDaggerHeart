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

    @Column(nullable = false)
    private String titulo;

    /** Tipo de carta: Dominio, Clase, Subclase, Linaje, Comunidad, Homebrew */
    @Column(nullable = false)
    private String tipo;

    private int nivel;

    /**
     * Descripción en Markdown para renderizar visualmente costes y habilidades.
     */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String descripcion;

    /**
     * Metadatos específicos en formato JSON.
     * Crucial para Clases (ej: evasión base, hp inicial, dominios permitidos)
     * u otras configuraciones especiales.
     */
    @Lob
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
}
