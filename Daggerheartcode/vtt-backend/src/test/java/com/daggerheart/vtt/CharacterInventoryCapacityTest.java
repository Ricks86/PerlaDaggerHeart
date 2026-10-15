package com.daggerheart.vtt;

import com.daggerheart.vtt.controller.GameController;
import com.daggerheart.vtt.model.Consumible;
import com.daggerheart.vtt.model.Item;
import com.daggerheart.vtt.model.PlayerCharacter;
import com.daggerheart.vtt.repository.AdversaryRepository;
import com.daggerheart.vtt.repository.CardRepository;
import com.daggerheart.vtt.repository.ItemRepository;
import com.daggerheart.vtt.repository.PlayerCharacterRepository;
import com.daggerheart.vtt.service.CharacterService;
import com.daggerheart.vtt.service.LevelUpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class CharacterInventoryCapacityTest {

    private PlayerCharacterRepository characterRepo;
    private CardRepository cardRepo;
    private ItemRepository itemRepo;
    private AdversaryRepository adversaryRepo;
    private SimpMessagingTemplate messagingTemplate;
    private LevelUpService levelUpService;
    private CharacterService characterService;
    private GameController gameController;

    @BeforeEach
    public void setUp() {
        characterRepo = Mockito.mock(PlayerCharacterRepository.class);
        cardRepo = Mockito.mock(CardRepository.class);
        itemRepo = Mockito.mock(ItemRepository.class);
        adversaryRepo = Mockito.mock(AdversaryRepository.class);
        messagingTemplate = Mockito.mock(SimpMessagingTemplate.class);
        levelUpService = Mockito.mock(LevelUpService.class);

        characterService = new CharacterService(
                characterRepo,
                itemRepo,
                messagingTemplate,
                levelUpService
        );

        gameController = new GameController(
                characterRepo,
                cardRepo,
                itemRepo,
                adversaryRepo,
                characterService
        );
    }

    @Test
    public void testAddItemToInventoryRejectsWhen20Items() {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setId(1L);
        pc.setNombre("TestHero");
        pc.setNivel(2);

        // Pre-fill inventory with 20 items
        for (int i = 0; i < 20; i++) {
            Consumible c = new Consumible();
            c.setId((long) (i + 1));
            c.setNombre("Item " + i);
            c.setTier(1);
            pc.getInventario().add(c);
        }

        Consumible extraItem = new Consumible();
        extraItem.setId(99L);
        extraItem.setNombre("Item Extra");
        extraItem.setTier(1);

        when(characterRepo.findById(1L)).thenReturn(Optional.of(pc));
        when(itemRepo.findById(99L)).thenReturn(Optional.of(extraItem));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            characterService.addItemToInventory(1L, 99L);
        });

        assertTrue(ex.getMessage().contains("El inventario del personaje está lleno"));
    }

    @Test
    public void testAddItemToInventoryAcceptsUpTo20Items() {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setId(1L);
        pc.setNombre("TestHero");
        pc.setNivel(2);

        // Pre-fill inventory with 19 items
        for (int i = 0; i < 19; i++) {
            Consumible c = new Consumible();
            c.setId((long) (i + 1));
            c.setNombre("Item " + i);
            c.setTier(1);
            pc.getInventario().add(c);
        }

        Consumible item20 = new Consumible();
        item20.setId(20L);
        item20.setNombre("Item 20");
        item20.setTier(1);

        when(characterRepo.findById(1L)).thenReturn(Optional.of(pc));
        when(itemRepo.findById(20L)).thenReturn(Optional.of(item20));
        when(characterRepo.save(any(PlayerCharacter.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PlayerCharacter updated = characterService.addItemToInventory(1L, 20L);
        assertEquals(20, updated.getInventario().size());
    }

    @Test
    public void testCreateCharacterRejectsWhenLevel1HasMoreThan5Consumables() {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setNombre("HeroLvl1");
        pc.setNivel(1);

        List<Item> inv = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            Consumible c = new Consumible();
            c.setId((long) (i + 1));
            inv.add(c);
            when(itemRepo.findById((long) (i + 1))).thenReturn(Optional.of(c));
        }
        pc.setInventario(inv);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            gameController.createCharacter(pc);
        });

        assertTrue(ex.getMessage().contains("máximo de 5 consumibles"));
    }

    @Test
    public void testCreateCharacterAccepts5ConsumablesAnd1StowedWeaponAtLevel1() {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setNombre("HeroLvl1");
        pc.setNivel(1);

        List<Item> inv = new ArrayList<>();
        // 5 consumables
        for (int i = 0; i < 5; i++) {
            Consumible c = new Consumible();
            c.setId((long) (i + 1));
            inv.add(c);
            when(itemRepo.findById((long) (i + 1))).thenReturn(Optional.of(c));
        }
        // 1 secondary weapon stowed due to two-handed main weapon
        com.daggerheart.vtt.model.Arma stowedWeapon = new com.daggerheart.vtt.model.Arma();
        stowedWeapon.setId(99L);
        stowedWeapon.setNombre("Espada Ancha");
        inv.add(stowedWeapon);
        when(itemRepo.findById(99L)).thenReturn(Optional.of(stowedWeapon));

        pc.setInventario(inv);

        when(characterRepo.save(any(PlayerCharacter.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<PlayerCharacter> res = gameController.createCharacter(pc);
        assertNotNull(res.getBody());
        assertEquals(6, res.getBody().getInventario().size());
    }

    @Test
    public void testCreateCharacterRejectsWhenLevel1HasMoreThan6ItemsTotal() {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setNombre("HeroLvl1");
        pc.setNivel(1);

        List<Item> inv = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            Consumible c = new Consumible();
            c.setId((long) (i + 1));
            inv.add(c);
            when(itemRepo.findById((long) (i + 1))).thenReturn(Optional.of(c));
        }
        for (int i = 100; i < 102; i++) {
            com.daggerheart.vtt.model.Arma w = new com.daggerheart.vtt.model.Arma();
            w.setId((long) i);
            inv.add(w);
            when(itemRepo.findById((long) i)).thenReturn(Optional.of(w));
        }
        pc.setInventario(inv);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            gameController.createCharacter(pc);
        });

        assertTrue(ex.getMessage().contains("no puede superar los 6 objetos"));
    }

    @Test
    public void testCreateCharacterAccepts5ItemsAtLevel1() {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setNombre("HeroLvl1");
        pc.setNivel(1);

        List<Item> inv = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            Consumible c = new Consumible();
            c.setId((long) (i + 1));
            inv.add(c);
            when(itemRepo.findById((long) (i + 1))).thenReturn(Optional.of(c));
        }
        pc.setInventario(inv);

        when(characterRepo.save(any(PlayerCharacter.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<PlayerCharacter> res = gameController.createCharacter(pc);
        assertNotNull(res.getBody());
        assertEquals(5, res.getBody().getInventario().size());
    }
}
