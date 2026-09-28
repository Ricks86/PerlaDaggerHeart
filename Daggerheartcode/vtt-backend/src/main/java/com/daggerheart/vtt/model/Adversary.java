package com.daggerheart.vtt.model;

import jakarta.persistence.*;

/**
 * Entidad Adversary: exclusiva para el DJ.
 * Representa enemigos/NPCs con sus stats de combate de Daggerheart.
 *
 * Los umbrales (mayor/grave) definen cuándo el adversario recibe
 * consecuencias de daño significativas.
 */
@Entity
@Table(name = "adversary")
public class Adversary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    /** "Menor", "Estándar", "Mayor", "Épico" */
    private String rango;

    /** "Fácil", "Moderado", "Difícil" */
    private String dificultad;

    /** Umbral de daño grave (HP reducido a la mitad o menos) */
    private int umbralMayor;

    /** Umbral de daño crítico (cercano a la derrota) */
    private int umbralGrave;

    private int hp;
    private int estres;
    private int modificadorAtaque;

    /** Notación de daño: "1d8+2", "2d6", etc. */
    private String danoEstandar;

    // -------------------------------------------------------------------------
    // Constructores
    // -------------------------------------------------------------------------
    public Adversary() {}

    // -------------------------------------------------------------------------
    // Getters y Setters
    // -------------------------------------------------------------------------
    public Long getId() { return id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getRango() { return rango; }
    public void setRango(String rango) { this.rango = rango; }

    public String getDificultad() { return dificultad; }
    public void setDificultad(String dificultad) { this.dificultad = dificultad; }

    public int getUmbralMayor() { return umbralMayor; }
    public void setUmbralMayor(int umbralMayor) { this.umbralMayor = umbralMayor; }

    public int getUmbralGrave() { return umbralGrave; }
    public void setUmbralGrave(int umbralGrave) { this.umbralGrave = umbralGrave; }

    public int getHp() { return hp; }
    public void setHp(int hp) { this.hp = hp; }

    public int getEstres() { return estres; }
    public void setEstres(int estres) { this.estres = estres; }

    public int getModificadorAtaque() { return modificadorAtaque; }
    public void setModificadorAtaque(int modificadorAtaque) { this.modificadorAtaque = modificadorAtaque; }

    public String getDanoEstandar() { return danoEstandar; }
    public void setDanoEstandar(String danoEstandar) { this.danoEstandar = danoEstandar; }
}
