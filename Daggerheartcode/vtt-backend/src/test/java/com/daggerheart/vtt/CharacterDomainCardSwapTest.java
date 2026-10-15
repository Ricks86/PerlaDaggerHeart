package com.daggerheart.vtt;

import com.daggerheart.vtt.dto.CardSwapRequest;
import com.daggerheart.vtt.dto.LevelUpOptionSelection;
import com.daggerheart.vtt.dto.LevelUpOptionType;
import com.daggerheart.vtt.dto.LevelUpRequest;
import com.daggerheart.vtt.model.Atributos;
import com.daggerheart.vtt.model.Card;
import com.daggerheart.vtt.model.Experiencia;
import com.daggerheart.vtt.model.PlayerCharacter;
import com.daggerheart.vtt.repository.CardRepository;
import com.daggerheart.vtt.repository.ItemRepository;
import com.daggerheart.vtt.repository.PlayerCharacterRepository;
import com.daggerheart.vtt.service.CharacterService;
import com.daggerheart.vtt.service.LevelUpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias para Sprint 26:
 * - Separación de Mazo Activo (Loadout, máx 5) y Bóveda (Vault).
 * - Enrutamiento automático en subida de nivel.
 * - Endpoint e intercambio de cartas con cobro de coste de recuperación en estrés (Gratis vs Tensión).
 */
public class CharacterDomainCardSwapTest {

    private PlayerCharacterRepository characterRepo;
    private ItemRepository itemRepo;
    private CardRepository cardRepo;
    private SimpMessagingTemplate messagingTemplate;
    private LevelUpService levelUpService;
    private CharacterService characterService;

    @BeforeEach
    public void setUp() {
        characterRepo = Mockito.mock(PlayerCharacterRepository.class);
        itemRepo = Mockito.mock(ItemRepository.class);
        cardRepo = Mockito.mock(CardRepository.class);
        messagingTemplate = Mockito.mock(SimpMessagingTemplate.class);

        levelUpService = new LevelUpService(cardRepo);
        characterService = new CharacterService(characterRepo, itemRepo, cardRepo, messagingTemplate, levelUpService);
    }

    private Card createCard(Long id, String titulo, String tipo, int nivel, int costeRecuperacion) {
        Card card = new Card();
        card.setId(id);
        card.setTitulo(titulo);
        card.setTipo(tipo);
        card.setNivel(nivel);
        card.setMetadata("{\"dominio\":\"Blade\",\"coste_recuperacion\":" + costeRecuperacion + "}");
        return card;
    }

    private PlayerCharacter createTestHero() {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setId(1L);
        pc.setNombre("Varis");
        pc.setNivel(1);
        pc.setCompetencia(1);
        pc.setHpMax(6);
        pc.setHpActual(6);
        pc.setEstresMax(6);
        pc.setEstresActual(1);
        pc.setEvasion(10);
        pc.setAtributos(new Atributos(1, 0, 0, 1, 0, 0));
        pc.setExperiencias(new ArrayList<>(List.of(new Experiencia("Rastreador", 2))));
        pc.setCartasActivasIds(new ArrayList<>());
        return pc;
    }

    @Test
    public void testLevelUpRoutesDomainCardToLoadoutWhenUnderFive() {
        PlayerCharacter pc = createTestHero();
        // Loadout con 3 cartas
        for (long i = 1; i <= 3; i++) {
            Card c = createCard(i, "Card " + i, "Dominio", 1, 1);
            pc.getLoadout().add(c);
        }

        Card newCard = createCard(100L, "Torbellino", "Dominio", 2, 1);
        when(cardRepo.findById(100L)).thenReturn(Optional.of(newCard));

        LevelUpRequest req = new LevelUpRequest();
        req.setDomainCardId(100L);
        req.setNewExperience(new Experiencia("Espadachín", 2));
        LevelUpOptionSelection opt1 = new LevelUpOptionSelection(LevelUpOptionType.INCREASE_TRAITS);
        opt1.setTraits(List.of("agilidad", "fuerza"));
        LevelUpOptionSelection opt2 = new LevelUpOptionSelection(LevelUpOptionType.GAIN_HP);
        req.setOptions(List.of(opt1, opt2));

        levelUpService.processLevelUp(pc, req);

        // Debe entrar al loadout (3 + 1 = 4 < 5)
        assertTrue(pc.getLoadout().contains(newCard));
        assertEquals(4, pc.getLoadout().size());
        assertEquals(0, pc.getBoveda().size());
        assertTrue(pc.getCartasActivasIds().contains(100L));
    }

    @Test
    public void testLevelUpRoutesDomainCardToBovedaWhenLoadoutHasFive() {
        PlayerCharacter pc = createTestHero();
        // Llenar loadout a 5 cartas
        for (long i = 1; i <= 5; i++) {
            Card c = createCard(i, "Card " + i, "Dominio", 1, 1);
            pc.getLoadout().add(c);
        }

        Card newCard = createCard(200L, "Furia Sagrada", "Dominio", 2, 2);
        when(cardRepo.findById(200L)).thenReturn(Optional.of(newCard));

        LevelUpRequest req = new LevelUpRequest();
        req.setDomainCardId(200L);
        req.setNewExperience(new Experiencia("Espadachín", 2));
        LevelUpOptionSelection opt1 = new LevelUpOptionSelection(LevelUpOptionType.INCREASE_TRAITS);
        opt1.setTraits(List.of("agilidad", "fuerza"));
        LevelUpOptionSelection opt2 = new LevelUpOptionSelection(LevelUpOptionType.GAIN_HP);
        req.setOptions(List.of(opt1, opt2));

        levelUpService.processLevelUp(pc, req);

        // Debe entrar a la boveda (loadout lleno con 5)
        assertEquals(5, pc.getLoadout().size());
        assertFalse(pc.getLoadout().contains(newCard));
        assertTrue(pc.getBoveda().contains(newCard));
        assertEquals(1, pc.getBoveda().size());
    }

    @Test
    public void testSwapFreeInRestDirectToLoadoutWhenSpaceAvailable() {
        PlayerCharacter pc = createTestHero();
        Card vaultCard = createCard(10L, "Filo Veloz", "Dominio", 1, 2);
        pc.getBoveda().add(vaultCard);

        when(characterRepo.findById(1L)).thenReturn(Optional.of(pc));
        when(characterRepo.save(any(PlayerCharacter.class))).thenAnswer(inv -> inv.getArgument(0));

        CardSwapRequest req = new CardSwapRequest(10L, null, true);
        PlayerCharacter result = characterService.swapDomainCard(1L, req);

        assertTrue(result.getLoadout().contains(vaultCard));
        assertFalse(result.getBoveda().contains(vaultCard));
        // Estrés no debe cambiar en intercambio libre
        assertEquals(1, result.getEstresActual());
    }

    @Test
    public void testSwapWhenLoadoutIsFullRequiresCardToVault() {
        PlayerCharacter pc = createTestHero();
        for (long i = 1; i <= 5; i++) {
            pc.getLoadout().add(createCard(i, "Card " + i, "Dominio", 1, 1));
        }
        Card vaultCard = createCard(99L, "Escudo de Almas", "Dominio", 1, 1);
        pc.getBoveda().add(vaultCard);

        when(characterRepo.findById(1L)).thenReturn(Optional.of(pc));

        // Petición sin cardToVaultId cuando loadout tiene 5 debe lanzar excepción
        CardSwapRequest req = new CardSwapRequest(99L, null, true);
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            characterService.swapDomainCard(1L, req);
        });
        assertTrue(ex.getMessage().contains("Loadout lleno"));
    }

    @Test
    public void testSwapWithStressPaymentDeductsStress() {
        PlayerCharacter pc = createTestHero();
        pc.setEstresActual(2);
        pc.setEstresMax(6); // 4 casillas libres

        Card vaultCard = createCard(50L, "Corte Devastador", "Dominio", 2, 2); // Coste recuperación: 2
        pc.getBoveda().add(vaultCard);

        when(characterRepo.findById(1L)).thenReturn(Optional.of(pc));
        when(characterRepo.save(any(PlayerCharacter.class))).thenAnswer(inv -> inv.getArgument(0));

        CardSwapRequest req = new CardSwapRequest(50L, null, false); // isFreeSwap = false
        PlayerCharacter result = characterService.swapDomainCard(1L, req);

        assertTrue(result.getLoadout().contains(vaultCard));
        // Estrés cobrado: 2 + 2 = 4
        assertEquals(4, result.getEstresActual());
    }

    @Test
    public void testSwapWithInsufficientStressThrowsException() {
        PlayerCharacter pc = createTestHero();
        pc.setEstresActual(5);
        pc.setEstresMax(6); // Solo 1 casilla libre

        Card vaultCard = createCard(50L, "Poder Titánico", "Dominio", 3, 2); // Requiere 2
        pc.getBoveda().add(vaultCard);

        when(characterRepo.findById(1L)).thenReturn(Optional.of(pc));

        CardSwapRequest req = new CardSwapRequest(50L, null, false); // isFreeSwap = false
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            characterService.swapDomainCard(1L, req);
        });
        assertTrue(ex.getMessage().contains("No tienes suficiente espacio de estrés"));
    }

    @Test
    public void testUnequipCardFromLoadoutToVault() {
        PlayerCharacter pc = createTestHero();
        Card activeCard = createCard(7L, "Paso Sombrío", "Dominio", 1, 1);
        pc.getLoadout().add(activeCard);

        when(characterRepo.findById(1L)).thenReturn(Optional.of(pc));
        when(characterRepo.save(any(PlayerCharacter.class))).thenAnswer(inv -> inv.getArgument(0));

        // Acción: enviar a bóveda (cardToLoadoutId = null, cardToVaultId = 7)
        CardSwapRequest req = new CardSwapRequest(null, 7L, true);
        PlayerCharacter result = characterService.swapDomainCard(1L, req);

        assertFalse(result.getLoadout().contains(activeCard));
        assertTrue(result.getBoveda().contains(activeCard));
    }

    @Test
    public void testEnsureLoadoutInitializedOnNewCharacterDoesNotSaveWhenIdIsNull() {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setId(null);
        pc.setCartasActivasIds(new ArrayList<>(List.of(101L, 102L)));

        Card c1 = createCard(101L, "Guarda Rúnica", "Dominio", 1, 0);
        Card c2 = createCard(102L, "Desatar el Caos", "Dominio", 1, 1);
        when(cardRepo.findAllById(List.of(101L, 102L))).thenReturn(List.of(c1, c2));

        characterService.ensureLoadoutInitialized(pc);

        assertEquals(2, pc.getLoadout().size());
        assertTrue(pc.getLoadout().contains(c1));
        assertTrue(pc.getLoadout().contains(c2));
        assertTrue(pc.getBoveda().isEmpty());
        Mockito.verify(characterRepo, Mockito.never()).save(any(PlayerCharacter.class));
    }

    @Test
    public void testHomebrewCardExemptFromDomainLoadoutAndDoesNotConsumeSlot() {
        PlayerCharacter pc = createTestHero();
        pc.setCartasActivasIds(new ArrayList<>(List.of(101L, 999L)));

        Card domainCard = createCard(101L, "Guarda Rúnica", "Dominio", 1, 0);
        Card homebrewCard = new Card();
        homebrewCard.setId(999L);
        homebrewCard.setTitulo("Regla de la Casa: Impacto Brutal");
        homebrewCard.setTipo("Homebrew");
        homebrewCard.setEsHomebrew(true);
        homebrewCard.setMetadata("{\"es_homebrew\":true}");

        when(cardRepo.findAllById(any())).thenReturn(List.of(domainCard, homebrewCard));

        // 1. isDomainCard debe ser falso para Homebrew
        assertFalse(characterService.isDomainCard(homebrewCard));
        assertTrue(characterService.isDomainCard(domainCard));

        // 2. ensureLoadoutInitialized solo debe meter la carta de Dominio al loadout, nunca la Homebrew
        characterService.ensureLoadoutInitialized(pc);

        assertEquals(1, pc.getLoadout().size());
        assertTrue(pc.getLoadout().contains(domainCard));
        assertFalse(pc.getLoadout().contains(homebrewCard));
        assertFalse(pc.getBoveda().contains(homebrewCard));
        // Pero la Homebrew debe seguir activa en cartasActivasIds
        assertTrue(pc.getCartasActivasIds().contains(999L));
        assertTrue(pc.getCartasActivasIds().contains(101L));

        // 3. Si por error una carta Homebrew estaba en loadout, debe ser purgada liberando el hueco
        pc.getLoadout().add(homebrewCard);
        assertEquals(2, pc.getLoadout().size());
        characterService.ensureLoadoutInitialized(pc);
        assertEquals(1, pc.getLoadout().size());
        assertFalse(pc.getLoadout().contains(homebrewCard));
        assertTrue(pc.getCartasActivasIds().contains(999L));
    }
}
