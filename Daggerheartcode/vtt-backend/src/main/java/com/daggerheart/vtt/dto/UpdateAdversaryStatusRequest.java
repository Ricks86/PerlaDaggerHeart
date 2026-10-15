package com.daggerheart.vtt.dto;

public class UpdateAdversaryStatusRequest {
    private Integer hpActual;
    private Integer estresActual;

    public UpdateAdversaryStatusRequest() {}

    public UpdateAdversaryStatusRequest(Integer hpActual, Integer estresActual) {
        this.hpActual = hpActual;
        this.estresActual = estresActual;
    }

    public Integer getHpActual() {
        return hpActual;
    }

    public void setHpActual(Integer hpActual) {
        this.hpActual = hpActual;
    }

    public Integer getEstresActual() {
        return estresActual;
    }

    public void setEstresActual(Integer estresActual) {
        this.estresActual = estresActual;
    }
}
