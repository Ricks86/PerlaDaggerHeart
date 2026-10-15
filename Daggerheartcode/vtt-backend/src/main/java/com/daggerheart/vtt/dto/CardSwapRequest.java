package com.daggerheart.vtt.dto;

/**
 * CardSwapRequest: Carga útil para intercambiar cartas entre la Bóveda y el Loadout (Sprint 26).
 */
public class CardSwapRequest {

    /**
     * ID de la carta de la bóveda que subirá al loadout (activo).
     * Opcional únicamente si se está desequipando una carta activa a la bóveda.
     */
    private Long cardToLoadoutId;

    /**
     * ID de la carta activa en el loadout que bajará a la bóveda.
     * Obligatorio si el loadout ya cuenta con 5 cartas.
     */
    private Long cardToVaultId;

    /**
     * Indica si el intercambio se produce en un descanso (gratis) o en tensión/combate (pago de estrés).
     */
    private boolean isFreeSwap;

    public CardSwapRequest() {}

    public CardSwapRequest(Long cardToLoadoutId, Long cardToVaultId, boolean isFreeSwap) {
        this.cardToLoadoutId = cardToLoadoutId;
        this.cardToVaultId = cardToVaultId;
        this.isFreeSwap = isFreeSwap;
    }

    public Long getCardToLoadoutId() {
        return cardToLoadoutId;
    }

    public void setCardToLoadoutId(Long cardToLoadoutId) {
        this.cardToLoadoutId = cardToLoadoutId;
    }

    public Long getCardToVaultId() {
        return cardToVaultId;
    }

    public void setCardToVaultId(Long cardToVaultId) {
        this.cardToVaultId = cardToVaultId;
    }

    public boolean isFreeSwap() {
        return isFreeSwap;
    }

    public void setFreeSwap(boolean freeSwap) {
        isFreeSwap = freeSwap;
    }
}
