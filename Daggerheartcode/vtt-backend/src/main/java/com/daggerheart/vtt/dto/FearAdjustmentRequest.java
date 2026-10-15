package com.daggerheart.vtt.dto;

/**
 * DTO para la petición de ajuste o gasto de Miedo por parte del DJ.
 */
public class FearAdjustmentRequest {

    private Integer delta;
    private Integer value;
    private String motivo;
    private Boolean silent = false;

    public FearAdjustmentRequest() {}

    public FearAdjustmentRequest(Integer delta, Integer value, String motivo) {
        this.delta = delta;
        this.value = value;
        this.motivo = motivo;
        this.silent = false;
    }

    public FearAdjustmentRequest(Integer delta, Integer value, String motivo, Boolean silent) {
        this.delta = delta;
        this.value = value;
        this.motivo = motivo;
        this.silent = silent;
    }

    public Integer getDelta() {
        return delta;
    }

    public void setDelta(Integer delta) {
        this.delta = delta;
    }

    public Integer getValue() {
        return value;
    }

    public void setValue(Integer value) {
        this.value = value;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public Boolean getSilent() {
        return silent;
    }

    public void setSilent(Boolean silent) {
        this.silent = silent;
    }
}
