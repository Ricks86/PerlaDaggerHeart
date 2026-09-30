package com.daggerheart.vtt.dto;

import com.daggerheart.vtt.model.Card;
import com.daggerheart.vtt.model.Experiencia;
import java.util.List;

/**
 * Payload para la subida de nivel de un personaje.
 */
public class LevelUpRequest {

    private Long characterId;

    // Carta de dominio obligatoria por nivel
    private Card domainCard;
    private Long domainCardId;

    // Nueva experiencia (obligatoria en hitos de Tier: niveles 2, 5 y 8)
    private Experiencia newExperience;

    // Exactamente 2 selecciones de la bolsa de Tier
    private List<LevelUpOptionSelection> options;

    public LevelUpRequest() {}

    public Long getCharacterId() { return characterId; }
    public void setCharacterId(Long characterId) { this.characterId = characterId; }

    public Card getDomainCard() { return domainCard; }
    public void setDomainCard(Card domainCard) { this.domainCard = domainCard; }

    public Long getDomainCardId() { return domainCardId; }
    public void setDomainCardId(Long domainCardId) { this.domainCardId = domainCardId; }

    public Experiencia getNewExperience() { return newExperience; }
    public void setNewExperience(Experiencia newExperience) { this.newExperience = newExperience; }

    public List<LevelUpOptionSelection> getOptions() { return options; }
    public void setOptions(List<LevelUpOptionSelection> options) { this.options = options; }
}
