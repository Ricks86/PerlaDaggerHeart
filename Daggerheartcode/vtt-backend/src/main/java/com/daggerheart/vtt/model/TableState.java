package com.daggerheart.vtt.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad TableState:
 * Representa el estado compartido y persistente de la mesa activa (sesión global singleton id = 1L).
 *
 * Contiene:
 *  - fearPool: Reserva de Miedo del Dungeon Master (mínimo 0, recomendado 12 máx. con indicador visual).
 *  - countdowns: Lista de relojes de cuenta atrás asociados a la sesión.
 */
@Entity
@Table(name = "table_state")
public class TableState {

    @Id
    private Long id = 1L;

    @Column(nullable = false)
    private int fearPool = 0;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "table_state_id")
    private List<Countdown> countdowns = new ArrayList<>();

    public TableState() {}

    public TableState(Long id, int fearPool, List<Countdown> countdowns) {
        this.id = id != null ? id : 1L;
        this.fearPool = Math.max(0, fearPool);
        this.countdowns = countdowns != null ? countdowns : new ArrayList<>();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getFearPool() {
        return fearPool;
    }

    public void setFearPool(int fearPool) {
        this.fearPool = Math.max(0, fearPool);
    }

    public List<Countdown> getCountdowns() {
        return countdowns;
    }

    public void setCountdowns(List<Countdown> countdowns) {
        this.countdowns = countdowns != null ? countdowns : new ArrayList<>();
    }
}
