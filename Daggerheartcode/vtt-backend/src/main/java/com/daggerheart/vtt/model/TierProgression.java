package com.daggerheart.vtt.model;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

/**
 * Registra la progresión del personaje en la bolsa de opciones del Tier activo.
 * Se reinicia al alcanzar hitos de nuevo Tier (niveles 2, 5 y 8).
 */
@Embeddable
public class TierProgression {

    private int traitsCount = 0;           // Máx 3 por Tier
    private int hpCount = 0;               // Máx 2 por Tier
    private int stressCount = 0;           // Máx 2 por Tier
    private int experiencesCount = 0;      // Máx 1 por Tier
    private int extraDomainCardsCount = 0; // Máx 1 por Tier
    private int evasionCount = 0;          // Máx 1 por Tier

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "player_character_marked_traits",
        joinColumns = @JoinColumn(name = "character_id")
    )
    @Column(name = "trait_name")
    private Set<String> markedTraitsInTier = new HashSet<>();

    public TierProgression() {}

    public void resetForNewTier() {
        this.traitsCount = 0;
        this.hpCount = 0;
        this.stressCount = 0;
        this.experiencesCount = 0;
        this.extraDomainCardsCount = 0;
        this.evasionCount = 0;
        this.markedTraitsInTier.clear();
    }

    public int getTraitsCount() { return traitsCount; }
    public void setTraitsCount(int traitsCount) { this.traitsCount = traitsCount; }

    public int getHpCount() { return hpCount; }
    public void setHpCount(int hpCount) { this.hpCount = hpCount; }

    public int getStressCount() { return stressCount; }
    public void setStressCount(int stressCount) { this.stressCount = stressCount; }

    public int getExperiencesCount() { return experiencesCount; }
    public void setExperiencesCount(int experiencesCount) { this.experiencesCount = experiencesCount; }

    public int getExtraDomainCardsCount() { return extraDomainCardsCount; }
    public void setExtraDomainCardsCount(int extraDomainCardsCount) { this.extraDomainCardsCount = extraDomainCardsCount; }

    public int getEvasionCount() { return evasionCount; }
    public void setEvasionCount(int evasionCount) { this.evasionCount = evasionCount; }

    public Set<String> getMarkedTraitsInTier() { return markedTraitsInTier; }
    public void setMarkedTraitsInTier(Set<String> markedTraitsInTier) { this.markedTraitsInTier = markedTraitsInTier; }
}
