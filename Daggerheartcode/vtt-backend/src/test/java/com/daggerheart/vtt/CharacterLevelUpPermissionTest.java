package com.daggerheart.vtt;

import com.daggerheart.vtt.dto.LevelUpRequest;
import com.daggerheart.vtt.model.PlayerCharacter;
import com.daggerheart.vtt.repository.ItemRepository;
import com.daggerheart.vtt.repository.PlayerCharacterRepository;
import com.daggerheart.vtt.service.CharacterService;
import com.daggerheart.vtt.service.LevelUpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class CharacterLevelUpPermissionTest {

    private PlayerCharacterRepository characterRepo;
    private ItemRepository itemRepo;
    private SimpMessagingTemplate messagingTemplate;
    private LevelUpService levelUpService;
    private CharacterService characterService;

    @BeforeEach
    public void setUp() {
        characterRepo = Mockito.mock(PlayerCharacterRepository.class);
        itemRepo = Mockito.mock(ItemRepository.class);
        messagingTemplate = Mockito.mock(SimpMessagingTemplate.class);
        levelUpService = Mockito.mock(LevelUpService.class);

        characterService = new CharacterService(
                characterRepo,
                itemRepo,
                messagingTemplate,
                levelUpService
        );
    }

    @Test
    public void testToggleLevelUpPermission() {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setId(10L);
        pc.setNombre("TestHero");
        pc.setPuedeSubirNivel(false);

        when(characterRepo.findById(10L)).thenReturn(Optional.of(pc));
        when(characterRepo.save(any(PlayerCharacter.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PlayerCharacter toggled = characterService.toggleLevelUpPermission(10L);
        assertTrue(toggled.isPuedeSubirNivel());

        PlayerCharacter toggledAgain = characterService.toggleLevelUpPermission(10L);
        assertFalse(toggledAgain.isPuedeSubirNivel());

        verify(messagingTemplate, times(2)).convertAndSend(eq("/topic/table"), any(Object.class));
    }

    @Test
    public void testLevelUpRejectedWhenPermissionNotGranted() {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setId(10L);
        pc.setPuedeSubirNivel(false);

        when(characterRepo.findById(10L)).thenReturn(Optional.of(pc));

        LevelUpRequest req = new LevelUpRequest();

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            characterService.levelUp(10L, req);
        });

        assertEquals("Subida de nivel no autorizada por el DJ.", ex.getMessage());
        verify(levelUpService, never()).processLevelUp(any(), any());
    }

    @Test
    public void testLevelUpConsumesPermission() {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setId(10L);
        pc.setPuedeSubirNivel(true);

        when(characterRepo.findById(10L)).thenReturn(Optional.of(pc));
        when(characterRepo.save(any(PlayerCharacter.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(levelUpService).processLevelUp(eq(pc), any(LevelUpRequest.class));

        LevelUpRequest req = new LevelUpRequest();
        PlayerCharacter result = characterService.levelUp(10L, req);

        assertFalse(result.isPuedeSubirNivel(), "Permission should be reset to false after level up");
        verify(characterRepo).save(pc);
        verify(messagingTemplate).convertAndSend(eq("/topic/table"), any(Object.class));
    }

    @Test
    public void testUpdateNotesPersistsAndBroadcasts() {
        PlayerCharacter pc = new PlayerCharacter();
        pc.setId(10L);
        pc.setNombre("TestHero");
        pc.setNotas("Notas anteriores");

        when(characterRepo.findById(10L)).thenReturn(Optional.of(pc));
        when(characterRepo.save(any(PlayerCharacter.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PlayerCharacter result = characterService.updateNotes(10L, "Nuevas notas de combate y bendiciones");

        assertEquals("Nuevas notas de combate y bendiciones", result.getNotas());
        verify(characterRepo).save(pc);
        verify(messagingTemplate).convertAndSend(eq("/topic/table"), any(Object.class));
    }
}
