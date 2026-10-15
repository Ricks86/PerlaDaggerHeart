package com.daggerheart.vtt.model;

import jakarta.persistence.*;

/**
 * Entidad AdversaryTemplate (Compendio / Bestiario):
 * Representa el molde reutilizable de un monstruo para el DJ.
 */
@Entity
@Table(name = "adversary_template")
public class AdversaryTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nombre;

    /** Tier de amenaza (1 a 4) */
    private Integer tier = 1;

    /** "Estándar", "Horda", "Líder", "Solitario", "Menor", etc. */
    private String rango = "Estándar";

    /** "Fácil", "Moderado", "Difícil" */
    private String dificultad = "Moderado";

    private Integer hpMaximo = 4;
    private Integer estresMaximo = 3;

    private Integer umbralMayor = 8;
    private Integer umbralGrave = 15;

    private Integer modAtaque = 2;

    /** Notación de daño: "1d8+2", "2d6", etc. */
    private String danoEstandar = "1d8+2";

    /** Pasivas, reacciones o movimientos de miedo del monstruo */
    @Column(columnDefinition = "TEXT")
    private String rasgosEspeciales;

    public AdversaryTemplate() {}

    public AdversaryTemplate(String nombre, Integer tier, String rango, String dificultad,
                             Integer hpMaximo, Integer estresMaximo, Integer umbralMayor,
                             Integer umbralGrave, Integer modAtaque, String danoEstandar,
                             String rasgosEspeciales) {
        this.nombre = nombre;
        this.tier = tier != null ? tier : 1;
        this.rango = rango != null ? rango : "Estándar";
        this.dificultad = dificultad != null ? dificultad : "Moderado";
        this.hpMaximo = hpMaximo != null ? hpMaximo : 4;
        this.estresMaximo = estresMaximo != null ? estresMaximo : 3;
        this.umbralMayor = umbralMayor != null ? umbralMayor : 8;
        this.umbralGrave = umbralGrave != null ? umbralGrave : 15;
        this.modAtaque = modAtaque != null ? modAtaque : 2;
        this.danoEstandar = danoEstandar != null ? danoEstandar : "1d8+2";
        this.rasgosEspeciales = rasgosEspeciales;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Integer getTier() { return tier; }
    public void setTier(Integer tier) { this.tier = tier; }

    public String getRango() { return rango; }
    public void setRango(String rango) { this.rango = rango; }

    public String getDificultad() { return dificultad; }
    public void setDificultad(String dificultad) { this.dificultad = dificultad; }

    public Integer getHpMaximo() { return hpMaximo; }
    public void setHpMaximo(Integer hpMaximo) { this.hpMaximo = hpMaximo; }

    public Integer getEstresMaximo() { return estresMaximo; }
    public void setEstresMaximo(Integer estresMaximo) { this.estresMaximo = estresMaximo; }

    public Integer getUmbralMayor() { return umbralMayor; }
    public void setUmbralMayor(Integer umbralMayor) { this.umbralMayor = umbralMayor; }

    public Integer getUmbralGrave() { return umbralGrave; }
    public void setUmbralGrave(Integer umbralGrave) { this.umbralGrave = umbralGrave; }

    public Integer getModAtaque() { return modAtaque; }
    public void setModAtaque(Integer modAtaque) { this.modAtaque = modAtaque; }

    public String getDanoEstandar() { return danoEstandar; }
    public void setDanoEstandar(String danoEstandar) { this.danoEstandar = danoEstandar; }

    public String getRasgosEspeciales() { return rasgosEspeciales; }
    public void setRasgosEspeciales(String rasgosEspeciales) { this.rasgosEspeciales = rasgosEspeciales; }
}
