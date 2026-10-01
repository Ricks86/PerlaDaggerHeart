package com.daggerheart.vtt.service;

import com.daggerheart.vtt.dto.LevelUpOptionSelection;
import com.daggerheart.vtt.dto.LevelUpOptionType;
import com.daggerheart.vtt.dto.LevelUpRequest;
import com.daggerheart.vtt.model.*;
import com.daggerheart.vtt.repository.CardRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Servicio encargado de la lógica y validación estricta de subida de nivel (Sprint 21).
 */
@Service
public class LevelUpService {

    private final CardRepository cardRepo;

    public LevelUpService(CardRepository cardRepo) {
        this.cardRepo = cardRepo;
    }

    /**
     * Aplica la subida de nivel sobre la entidad PlayerCharacter validando todas las reglas de negocio.
     */
    public void processLevelUp(PlayerCharacter character, LevelUpRequest request) {
        if (character == null) {
            throw new IllegalArgumentException("El personaje no puede ser nulo.");
        }

        int nivelActual = character.getNivel();
        if (nivelActual >= 10) {
            throw new IllegalStateException("El personaje ya ha alcanzado el nivel máximo permitido (10).");
        }

        int nuevoNivel = nivelActual + 1;

        // 1. Detección de Hito de Tier (Niveles 2, 5 y 8)
        boolean isTierMilestone = (nuevoNivel == 2 || nuevoNivel == 5 || nuevoNivel == 8);
        if (isTierMilestone) {
            // Incrementa la competencia en +1
            character.setCompetencia(character.getCompetencia() + 1);

            // Valida y añade la nueva experiencia con modificador base +2
            if (request.getNewExperience() == null ||
                request.getNewExperience().getNombre() == null ||
                request.getNewExperience().getNombre().trim().isEmpty()) {
                throw new IllegalArgumentException(
                        "Al alcanzar el nivel " + nuevoNivel + " (hito de nuevo Tier) es obligatorio definir una nueva Experiencia."
                );
            }

            int valorBase = request.getNewExperience().getValor() > 0 ? request.getNewExperience().getValor() : 2;
            Experiencia nuevaExp = new Experiencia(request.getNewExperience().getNombre().trim(), valorBase);
            character.getExperiencias().add(nuevaExp);

            // 3. LIMPIAR LA BOLSA ANTES DE VALIDAR LAS 2 OPCIONES SELECCIONADAS
            if (character.getTierProgression() == null) {
                character.setTierProgression(new TierProgression());
            }
            character.getTierProgression().resetForNewTier();
        }

        // 2. Carta de Dominio Obligatoria por nivel
        Long domainCardId = resolveCardId(request.getDomainCard(), request.getDomainCardId());
        if (domainCardId == null) {
            throw new IllegalArgumentException("Debe seleccionar una carta de dominio obligatoria al subir de nivel.");
        }
        if (!character.getCartasActivasIds().contains(domainCardId)) {
            character.getCartasActivasIds().add(domainCardId);
        }

        // 3. Validación de exactamente 2 selecciones de la bolsa
        List<LevelUpOptionSelection> options = request.getOptions();
        if (options == null || options.size() != 2) {
            throw new IllegalArgumentException("Debe seleccionar exactamente 2 opciones de la bolsa de Tier.");
        }

        // 4. Aplicación secuencial de las 2 opciones seleccionadas
        TierProgression tp = character.getTierProgression();
        for (int i = 0; i < options.size(); i++) {
            LevelUpOptionSelection opt = options.get(i);
            if (opt == null || opt.getType() == null) {
                throw new IllegalArgumentException("La opción de subida de nivel #" + (i + 1) + " no es válida.");
            }
            applyOption(character, tp, opt);
        }

        // 5. Asignar el nuevo nivel
        character.setNivel(nuevoNivel);
    }

    private void applyOption(PlayerCharacter character, TierProgression tp, LevelUpOptionSelection opt) {
        LevelUpOptionType type = opt.getType();

        switch (type) {
            case INCREASE_TRAITS -> {
                if (tp.getTraitsCount() >= 3) {
                    throw new IllegalStateException("Se ha alcanzado el límite máximo de mejora de atributos (3) en este Tier.");
                }
                List<String> traits = opt.getTraits();
                if (traits == null || traits.size() != 2) {
                    throw new IllegalArgumentException("Debe seleccionar exactamente 2 atributos para la opción INCREASE_TRAITS.");
                }
                String t1 = traits.get(0).trim().toLowerCase();
                String t2 = traits.get(1).trim().toLowerCase();

                if (t1.equals(t2)) {
                    throw new IllegalArgumentException("Los 2 atributos seleccionados deben ser diferentes.");
                }
                if (tp.getMarkedTraitsInTier().contains(t1)) {
                    throw new IllegalArgumentException("El atributo '" + traits.get(0) + "' ya ha sido mejorado en este Tier.");
                }
                if (tp.getMarkedTraitsInTier().contains(t2)) {
                    throw new IllegalArgumentException("El atributo '" + traits.get(1) + "' ya ha sido mejorado en este Tier.");
                }

                if (character.getAtributos() == null) {
                    character.setAtributos(new Atributos());
                }
                incrementTrait(character.getAtributos(), t1);
                incrementTrait(character.getAtributos(), t2);

                tp.getMarkedTraitsInTier().add(t1);
                tp.getMarkedTraitsInTier().add(t2);
                tp.setTraitsCount(tp.getTraitsCount() + 1);
            }
            case GAIN_HP -> {
                if (tp.getHpCount() >= 2) {
                    throw new IllegalStateException("Se ha alcanzado el límite máximo de aumento de HP (2) en este Tier.");
                }
                character.setHpMax(character.getHpMax() + 1);
                character.setHpActual(character.getHpActual() + 1);
                tp.setHpCount(tp.getHpCount() + 1);
            }
            case GAIN_STRESS -> {
                if (tp.getStressCount() >= 2) {
                    throw new IllegalStateException("Se ha alcanzado el límite máximo de aumento de Estrés (2) en este Tier.");
                }
                character.setEstresMax(character.getEstresMax() + 1);
                tp.setStressCount(tp.getStressCount() + 1);
            }
            case INCREASE_EXPERIENCES -> {
                if (tp.getExperiencesCount() >= 1) {
                    throw new IllegalStateException("Se ha alcanzado el límite máximo de mejora de experiencias (1) en este Tier.");
                }
                List<String> expNames = opt.getExperienceNames();
                if (expNames == null || expNames.size() != 2) {
                    throw new IllegalArgumentException("Debe seleccionar 2 experiencias existentes para mejorar en +1.");
                }
                String name1 = expNames.get(0).trim().toLowerCase();
                String name2 = expNames.get(1).trim().toLowerCase();

                Experiencia exp1 = findExperience(character, name1);
                Experiencia exp2 = findExperience(character, name2);

                if (exp1 == null) {
                    throw new IllegalArgumentException("No se encontró la experiencia '" + expNames.get(0) + "' en el personaje.");
                }
                if (exp2 == null) {
                    throw new IllegalArgumentException("No se encontró la experiencia '" + expNames.get(1) + "' en el personaje.");
                }

                exp1.setValor(exp1.getValor() + 1);
                exp2.setValor(exp2.getValor() + 1);
                tp.setExperiencesCount(tp.getExperiencesCount() + 1);
            }
            case EXTRA_DOMAIN_CARD -> {
                if (tp.getExtraDomainCardsCount() >= 1) {
                    throw new IllegalStateException("Se ha alcanzado el límite máximo de carta extra de dominio (1) en este Tier.");
                }
                Long extraId = resolveCardId(opt.getExtraCard(), opt.getExtraCardId());
                if (extraId == null) {
                    throw new IllegalArgumentException("Debe especificar la carta de dominio extra para EXTRA_DOMAIN_CARD.");
                }
                if (!character.getCartasActivasIds().contains(extraId)) {
                    character.getCartasActivasIds().add(extraId);
                }
                tp.setExtraDomainCardsCount(tp.getExtraDomainCardsCount() + 1);
            }
            case INCREASE_EVASION -> {
                if (tp.getEvasionCount() >= 1) {
                    throw new IllegalStateException("Se ha alcanzado el límite máximo de aumento de Evasión (1) en este Tier.");
                }
                character.setEvasion(character.getEvasion() + 1);
                tp.setEvasionCount(tp.getEvasionCount() + 1);
            }
        }
    }

    private void incrementTrait(Atributos attr, String traitKey) {
        switch (traitKey) {
            case "agilidad" -> attr.setAgilidad(attr.getAgilidad() + 1);
            case "fuerza" -> attr.setFuerza(attr.getFuerza() + 1);
            case "sutileza" -> attr.setSutileza(attr.getSutileza() + 1);
            case "instinto" -> attr.setInstinto(attr.getInstinto() + 1);
            case "presencia" -> attr.setPresencia(attr.getPresencia() + 1);
            case "conocimiento" -> attr.setConocimiento(attr.getConocimiento() + 1);
            default -> throw new IllegalArgumentException("Atributo desconocido: " + traitKey);
        }
    }

    private Experiencia findExperience(PlayerCharacter character, String normalizedName) {
        if (character.getExperiencias() == null) return null;
        for (Experiencia exp : character.getExperiencias()) {
            if (exp.getNombre() != null && exp.getNombre().trim().toLowerCase().equals(normalizedName)) {
                return exp;
            }
        }
        return null;
    }

    private Long resolveCardId(Card card, Long cardId) {
        if (cardId != null) return cardId;
        if (card != null) {
            if (card.getId() != null) return card.getId();
            Card saved = cardRepo.save(card);
            return saved.getId();
        }
        return null;
    }
}
