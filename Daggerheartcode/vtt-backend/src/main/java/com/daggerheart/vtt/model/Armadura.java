package com.daggerheart.vtt.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Subclase Armadura: protección corporal que otorga ranuras de armadura y umbrales de daño.
 */
@Entity
@Table(name = "item_armadura")
public class Armadura extends Item {

    /** Puntuación base de armadura (determina las ranuras de armadura disponibles) */
    private int puntuacionBase;

    /** Umbral de daño mayor base */
    private int umbralMayorBase;

    /** Umbral de daño grave base */
    private int umbralGraveBase;

    /** Rasgo o efecto especial, ej. "-1 a Evasión" o "+1 a Evasión en bosques" */
    @Column(columnDefinition = "TEXT")
    private String rasgoEspecial;

    public Armadura() {
        super();
    }

    public Armadura(String nombre, int tier, int puntuacionBase, int umbralMayorBase,
                    int umbralGraveBase, String rasgoEspecial) {
        super(nombre, tier);
        this.puntuacionBase = puntuacionBase;
        this.umbralMayorBase = umbralMayorBase;
        this.umbralGraveBase = umbralGraveBase;
        this.rasgoEspecial = rasgoEspecial;
    }

    @Override
    public String getTipo() {
        return "Armadura";
    }

    public int getPuntuacionBase() { return puntuacionBase; }
    public void setPuntuacionBase(int puntuacionBase) { this.puntuacionBase = puntuacionBase; }

    public int getUmbralMayorBase() { return umbralMayorBase; }
    public void setUmbralMayorBase(int umbralMayorBase) { this.umbralMayorBase = umbralMayorBase; }

    public int getUmbralGraveBase() { return umbralGraveBase; }
    public void setUmbralGraveBase(int umbralGraveBase) { this.umbralGraveBase = umbralGraveBase; }

    public String getRasgoEspecial() { return rasgoEspecial; }
    public void setRasgoEspecial(String rasgoEspecial) { this.rasgoEspecial = rasgoEspecial; }
}
