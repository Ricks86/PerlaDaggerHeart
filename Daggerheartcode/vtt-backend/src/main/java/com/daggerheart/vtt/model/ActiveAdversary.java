package com.daggerheart.vtt.model;

import jakarta.persistence.*;

/**
 * Entidad ActiveAdversary (Monstruos en Escena):
 * Representa la instancia viva en el encuentro actual del DJ (máx. 15 simultáneos).
 */
@Entity
@Table(name = "active_adversary")
public class ActiveAdversary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Referencia opcional al molde en el compendio */
    private Long templateId;

    /** Nombre instanciado único en escena (ej. "Trasgo Arquero N°1", "Bandido N°2") */
    @Column(nullable = false)
    private String nombreInstancia;

    private Integer tier = 1;
    private String rango = "Estándar";
    private String dificultad = "Moderado";

    private Integer hpActual = 4;
    private Integer hpMaximo = 4;

    private Integer estresActual = 0;
    private Integer estresMaximo = 3;

    private Integer umbralMayor = 8;
    private Integer umbralGrave = 15;

    private Integer modAtaque = 2;
    private String danoEstandar = "1d8+2";

    @Column(columnDefinition = "TEXT")
    private String rasgosEspeciales;

    public ActiveAdversary() {}

    public ActiveAdversary(Long templateId, String nombreInstancia, Integer tier, String rango,
                           String dificultad, Integer hpActual, Integer hpMaximo,
                           Integer estresActual, Integer estresMaximo, Integer umbralMayor,
                           Integer umbralGrave, Integer modAtaque, String danoEstandar,
                           String rasgosEspeciales) {
        this.templateId = templateId;
        this.nombreInstancia = nombreInstancia;
        this.tier = tier != null ? tier : 1;
        this.rango = rango != null ? rango : "Estándar";
        this.dificultad = dificultad != null ? dificultad : "Moderado";
        this.hpActual = hpActual != null ? hpActual : hpMaximo;
        this.hpMaximo = hpMaximo != null ? hpMaximo : 4;
        this.estresActual = estresActual != null ? estresActual : 0;
        this.estresMaximo = estresMaximo != null ? estresMaximo : 3;
        this.umbralMayor = umbralMayor != null ? umbralMayor : 8;
        this.umbralGrave = umbralGrave != null ? umbralGrave : 15;
        this.modAtaque = modAtaque != null ? modAtaque : 2;
        this.danoEstandar = danoEstandar != null ? danoEstandar : "1d8+2";
        this.rasgosEspeciales = rasgosEspeciales;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTemplateId() { return templateId; }
    public void setTemplateId(Long templateId) { this.templateId = templateId; }

    public String getNombreInstancia() { return nombreInstancia; }
    public void setNombreInstancia(String nombreInstancia) { this.nombreInstancia = nombreInstancia; }

    public Integer getTier() { return tier; }
    public void setTier(Integer tier) { this.tier = tier; }

    public String getRango() { return rango; }
    public void setRango(String rango) { this.rango = rango; }

    public String getDificultad() { return dificultad; }
    public void setDificultad(String dificultad) { this.dificultad = dificultad; }

    public Integer getHpActual() { return hpActual; }
    public void setHpActual(Integer hpActual) { this.hpActual = hpActual; }

    public Integer getHpMaximo() { return hpMaximo; }
    public void setHpMaximo(Integer hpMaximo) { this.hpMaximo = hpMaximo; }

    public Integer getEstresActual() { return estresActual; }
    public void setEstresActual(Integer estresActual) { this.estresActual = estresActual; }

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
