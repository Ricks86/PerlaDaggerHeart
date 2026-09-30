package com.daggerheart.vtt;

import com.daggerheart.vtt.dto.LevelUpOptionSelection;
import com.daggerheart.vtt.dto.LevelUpOptionType;
import com.daggerheart.vtt.dto.LevelUpRequest;
import com.daggerheart.vtt.model.Atributos;
import com.daggerheart.vtt.model.Experiencia;
import com.daggerheart.vtt.model.PlayerCharacter;
import com.daggerheart.vtt.repository.CardRepository;
import com.daggerheart.vtt.service.LevelUpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class LevelUpServiceTest {

    private CardRepository cardRepo;
    private LevelUpService levelUpService;

    @BeforeEach
    public void setUp() {
        cardRepo = Mockito.mock(CardRepository.class);
        levelUpService = new LevelUpService(cardRepo);
    }

    private PlayerCharacter createTestCharacter(int level) {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setId(1L);
        pc.setNombre("TestHero");
        pc.setNivel(level);
        pc.setCompetencia(1);
        pc.setHpMax(6);
        pc.setHpActual(6);
        pc.setEstresMax(5);
        pc.setEstresActual(0);
        pc.setEvasion(10);
        pc.setAtributos(new Atributos(1, 0, 0, 1, 0, 0));
        pc.setExperiencias(new ArrayList<>());
        pc.getExperiencias().add(new Experiencia("Superviviente", 2));
        pc.getExperiencias().add(new Experiencia("Erudito", 2));
        pc.setCartasActivasIds(new ArrayList<>());
        return pc;
    }

    @Test
    public void testLevelUpToTierMilestoneLevel2() {
        PlayerCharacter pc = createTestCharacter(1);

        LevelUpRequest req = new LevelUpRequest();
        req.setDomainCardId(101L);
        req.setNewExperience(new Experiencia("Rastreador", 2));

        LevelUpOptionSelection opt1 = new LevelUpOptionSelection(LevelUpOptionType.INCREASE_TRAITS);
        opt1.setTraits(List.of("agilidad", "fuerza"));

        LevelUpOptionSelection opt2 = new LevelUpOptionSelection(LevelUpOptionType.GAIN_HP);

        req.setOptions(List.of(opt1, opt2));

        levelUpService.processLevelUp(pc, req);

        // Verificaciones de Nivel y Hito de Tier
        assertEquals(2, pc.getNivel());
        assertEquals(2, pc.getCompetencia()); // Subió de 1 a 2
        assertEquals(3, pc.getExperiencias().size()); // Se añadió Rastreador
        assertEquals("Rastreador", pc.getExperiencias().get(2).getNombre());
        assertEquals(2, pc.getExperiencias().get(2).getValor());

        // Carta de dominio vinculada
        assertTrue(pc.getCartasActivasIds().contains(101L));

        // Verificación de Atributos
        assertEquals(2, pc.getAtributos().getAgilidad()); // 1 + 1
        assertEquals(1, pc.getAtributos().getFuerza());   // 0 + 1
        assertTrue(pc.getTierProgression().getMarkedTraitsInTier().contains("agilidad"));
        assertTrue(pc.getTierProgression().getMarkedTraitsInTier().contains("fuerza"));
        assertEquals(1, pc.getTierProgression().getTraitsCount());

        // Verificación de HP
        assertEquals(7, pc.getHpMax()); // 6 + 1
        assertEquals(7, pc.getHpActual());
        assertEquals(1, pc.getTierProgression().getHpCount());
    }

    @Test
    public void testLevelUpMaxLevelReachedThrowsException() {
        PlayerCharacter pc = createTestCharacter(10);
        LevelUpRequest req = new LevelUpRequest();
        req.setDomainCardId(101L);
        req.setOptions(List.of(
                new LevelUpOptionSelection(LevelUpOptionType.GAIN_HP),
                new LevelUpOptionSelection(LevelUpOptionType.GAIN_STRESS)
        ));

        assertThrows(IllegalStateException.class, () -> levelUpService.processLevelUp(pc, req));
    }

    @Test
    public void testLevelUpMissingExperienceOnMilestoneThrowsException() {
        PlayerCharacter pc = createTestCharacter(1);
        LevelUpRequest req = new LevelUpRequest();
        req.setDomainCardId(101L);
        // Falta newExperience al subir a nivel 2
        req.setOptions(List.of(
                new LevelUpOptionSelection(LevelUpOptionType.GAIN_HP),
                new LevelUpOptionSelection(LevelUpOptionType.GAIN_STRESS)
        ));

        assertThrows(IllegalArgumentException.class, () -> levelUpService.processLevelUp(pc, req));
    }

    @Test
    public void testLevelUpTraitsLimitInTier() {
        PlayerCharacter pc = createTestCharacter(2);
        // Simulamos que ya gastó los 3 usos de INCREASE_TRAITS en este Tier
        pc.getTierProgression().setTraitsCount(3);

        LevelUpRequest req = new LevelUpRequest();
        req.setDomainCardId(102L);

        LevelUpOptionSelection opt1 = new LevelUpOptionSelection(LevelUpOptionType.INCREASE_TRAITS);
        opt1.setTraits(List.of("sutileza", "instinto"));
        LevelUpOptionSelection opt2 = new LevelUpOptionSelection(LevelUpOptionType.GAIN_HP);
        req.setOptions(List.of(opt1, opt2));

        assertThrows(IllegalStateException.class, () -> levelUpService.processLevelUp(pc, req));
    }

    @Test
    public void testLevelUpDuplicateTraitImprovementInSameTier() {
        PlayerCharacter pc = createTestCharacter(2);
        // Ya mejoró "agilidad" en este Tier
        pc.getTierProgression().getMarkedTraitsInTier().add("agilidad");

        LevelUpRequest req = new LevelUpRequest();
        req.setDomainCardId(102L);

        LevelUpOptionSelection opt1 = new LevelUpOptionSelection(LevelUpOptionType.INCREASE_TRAITS);
        opt1.setTraits(List.of("agilidad", "fuerza")); // Intento de repetir agilidad
        LevelUpOptionSelection opt2 = new LevelUpOptionSelection(LevelUpOptionType.GAIN_HP);
        req.setOptions(List.of(opt1, opt2));

        assertThrows(IllegalArgumentException.class, () -> levelUpService.processLevelUp(pc, req));
    }

    @Test
    public void testLevelUpExperiencesAndEvasion() {
        PlayerCharacter pc = createTestCharacter(2);

        LevelUpRequest req = new LevelUpRequest();
        req.setDomainCardId(102L);

        LevelUpOptionSelection opt1 = new LevelUpOptionSelection(LevelUpOptionType.INCREASE_EXPERIENCES);
        opt1.setExperienceNames(List.of("superviviente", "erudito"));

        LevelUpOptionSelection opt2 = new LevelUpOptionSelection(LevelUpOptionType.INCREASE_EVASION);

        req.setOptions(List.of(opt1, opt2));

        levelUpService.processLevelUp(pc, req);

        // Verificación de Nivel
        assertEquals(3, pc.getNivel());

        // Experiencias mejoradas en +1
        assertEquals(3, pc.getExperiencias().get(0).getValor()); // 2 + 1
        assertEquals(3, pc.getExperiencias().get(1).getValor()); // 2 + 1
        assertEquals(1, pc.getTierProgression().getExperiencesCount());

        // Evasión incrementada
        assertEquals(11, pc.getEvasion()); // 10 + 1
        assertEquals(1, pc.getTierProgression().getEvasionCount());
    }

    @Test
    public void testResetForNewTierOnLevel5Milestone() {
        PlayerCharacter pc = createTestCharacter(4);
        // Marcamos traits y bolsa llena en Tier 2
        pc.getTierProgression().setTraitsCount(3);
        pc.getTierProgression().getMarkedTraitsInTier().add("agilidad");
        pc.getTierProgression().getMarkedTraitsInTier().add("fuerza");
        pc.setCompetencia(2);

        LevelUpRequest req = new LevelUpRequest();
        req.setDomainCardId(105L);
        req.setNewExperience(new Experiencia("Veterano de Guerra", 2));

        // En nivel 5 (Tier 3) la bolsa se resetea, por lo que puede volver a elegir agilidad y fuerza
        LevelUpOptionSelection opt1 = new LevelUpOptionSelection(LevelUpOptionType.INCREASE_TRAITS);
        opt1.setTraits(List.of("agilidad", "fuerza"));
        LevelUpOptionSelection opt2 = new LevelUpOptionSelection(LevelUpOptionType.GAIN_HP);

        req.setOptions(List.of(opt1, opt2));

        levelUpService.processLevelUp(pc, req);

        assertEquals(5, pc.getNivel());
        assertEquals(3, pc.getCompetencia()); // 2 + 1
        assertEquals(1, pc.getTierProgression().getTraitsCount());
        assertEquals(1, pc.getTierProgression().getHpCount());
        assertTrue(pc.getTierProgression().getMarkedTraitsInTier().contains("agilidad"));
    }
}
