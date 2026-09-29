package com.daggerheart.vtt.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.*;
import java.util.Objects;

/**
 * Entidad abstracta base Item para el sistema de inventario y equipamiento.
 * Implementa polimorfismo mediante herencia JOINED en Spring Boot / JPA.
 */
@Entity
@Table(name = "item")
@Inheritance(strategy = InheritanceType.JOINED)
@JsonTypeInfo(use = JsonTypeInfo.Id.DEDUCTION)
@JsonSubTypes({
    @JsonSubTypes.Type(value = Arma.class),
    @JsonSubTypes.Type(value = Armadura.class),
    @JsonSubTypes.Type(value = Consumible.class)
})
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private int tier = 1;

    public Item() {}

    public Item(String nombre, int tier) {
        this.nombre = nombre;
        this.tier = tier;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public int getTier() { return tier; }
    public void setTier(int tier) { this.tier = tier; }

    public abstract String getTipo();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Item item = (Item) o;
        return id != null && id.equals(item.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
