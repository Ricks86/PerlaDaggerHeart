package com.daggerheart.vtt.dto;

import com.daggerheart.vtt.model.Card;
import java.util.List;

/**
 * Representa una de las dos elecciones tomadas de la bolsa de Tier al subir de nivel.
 */
public class LevelUpOptionSelection {

    private LevelUpOptionType type;

    // Para INCREASE_TRAITS: lista de 2 atributos distintos a mejorar (ej. ["fuerza", "agilidad"])
    private List<String> traits;

    // Para INCREASE_EXPERIENCES: lista de 2 nombres de experiencias existentes
    private List<String> experienceNames;

    // Para EXTRA_DOMAIN_CARD: la carta adicional vinculada o su ID
    private Card extraCard;
    private Long extraCardId;

    public LevelUpOptionSelection() {}

    public LevelUpOptionSelection(LevelUpOptionType type) {
        this.type = type;
    }

    public LevelUpOptionType getType() { return type; }
    public void setType(LevelUpOptionType type) { this.type = type; }

    public List<String> getTraits() { return traits; }
    public void setTraits(List<String> traits) { this.traits = traits; }

    public List<String> getExperienceNames() { return experienceNames; }
    public void setExperienceNames(List<String> experienceNames) { this.experienceNames = experienceNames; }

    public Card getExtraCard() { return extraCard; }
    public void setExtraCard(Card extraCard) { this.extraCard = extraCard; }

    public Long getExtraCardId() { return extraCardId; }
    public void setExtraCardId(Long extraCardId) { this.extraCardId = extraCardId; }
}
