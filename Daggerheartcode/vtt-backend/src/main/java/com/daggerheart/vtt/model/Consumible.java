package com.daggerheart.vtt.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Subclase Consumible: pociones, elixires, pergaminos u objetos de un solo uso.
 */
@Entity
@Table(name = "item_consumible")
public class Consumible extends Item {

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    public Consumible() {
        super();
    }

    public Consumible(String nombre, int tier, String descripcion) {
        super(nombre, tier);
        this.descripcion = descripcion;
    }

    @Override
    public String getTipo() {
        return "Consumible";
    }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
}
