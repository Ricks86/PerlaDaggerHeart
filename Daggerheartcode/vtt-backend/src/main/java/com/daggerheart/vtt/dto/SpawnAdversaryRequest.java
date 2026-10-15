package com.daggerheart.vtt.dto;

public class SpawnAdversaryRequest {
    private Long templateId;
    private Integer cantidad = 1;

    // Optional direct fields if spawning a custom monster or overriding template
    private String nombre;
    private Integer tier;
    private String rango;
    private String dificultad;
    private Integer hpMaximo;
    private Integer estresMaximo;
    private Integer umbralMayor;
    private Integer umbralGrave;
    private Integer modAtaque;
    private String danoEstandar;
    private String rasgosEspeciales;

    public SpawnAdversaryRequest() {}

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public Integer getCantidad() {
        return cantidad != null ? cantidad : 1;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Integer getTier() {
        return tier;
    }

    public void setTier(Integer tier) {
        this.tier = tier;
    }

    public String getRango() {
        return rango;
    }

    public void setRango(String rango) {
        this.rango = rango;
    }

    public String getDificultad() {
        return dificultad;
    }

    public void setDificultad(String dificultad) {
        this.dificultad = dificultad;
    }

    public Integer getHpMaximo() {
        return hpMaximo;
    }

    public void setHpMaximo(Integer hpMaximo) {
        this.hpMaximo = hpMaximo;
    }

    public Integer getEstresMaximo() {
        return estresMaximo;
    }

    public void setEstresMaximo(Integer estresMaximo) {
        this.estresMaximo = estresMaximo;
    }

    public Integer getUmbralMayor() {
        return umbralMayor;
    }

    public void setUmbralMayor(Integer umbralMayor) {
        this.umbralMayor = umbralMayor;
    }

    public Integer getUmbralGrave() {
        return umbralGrave;
    }

    public void setUmbralGrave(Integer umbralGrave) {
        this.umbralGrave = umbralGrave;
    }

    public Integer getModAtaque() {
        return modAtaque;
    }

    public void setModAtaque(Integer modAtaque) {
        this.modAtaque = modAtaque;
    }

    public String getDanoEstandar() {
        return danoEstandar;
    }

    public void setDanoEstandar(String danoEstandar) {
        this.danoEstandar = danoEstandar;
    }

    public String getRasgosEspeciales() {
        return rasgosEspeciales;
    }

    public void setRasgosEspeciales(String rasgosEspeciales) {
        this.rasgosEspeciales = rasgosEspeciales;
    }
}
