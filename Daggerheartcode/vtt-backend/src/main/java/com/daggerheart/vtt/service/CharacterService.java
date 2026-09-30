package com.daggerheart.vtt.service;

import com.daggerheart.vtt.dto.LevelUpRequest;
import com.daggerheart.vtt.dto.TableAction;
import com.daggerheart.vtt.model.Item;
import com.daggerheart.vtt.model.PlayerCharacter;
import com.daggerheart.vtt.repository.ItemRepository;
import com.daggerheart.vtt.repository.PlayerCharacterRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
@Transactional
public class CharacterService {

    private final PlayerCharacterRepository characterRepo;
    private final ItemRepository itemRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final LevelUpService levelUpService;

    public CharacterService(
            PlayerCharacterRepository characterRepo,
            ItemRepository itemRepo,
            SimpMessagingTemplate messagingTemplate,
            LevelUpService levelUpService) {
        this.characterRepo = characterRepo;
        this.itemRepo = itemRepo;
        this.messagingTemplate = messagingTemplate;
        this.levelUpService = levelUpService;
    }

    /**
     * Calcula el Tier máximo permitido según el nivel del personaje:
     * - Nivel 1           → Tier 1
     * - Niveles 2 al 4    → Tier 2 o inferior
     * - Niveles 5 al 7    → Tier 3 o inferior
     * - Niveles 8 al 10   → Tier 4 o inferior
     */
    public int getMaxAllowedTier(int nivel) {
        if (nivel <= 1) return 1;
        if (nivel <= 4) return 2;
        if (nivel <= 7) return 3;
        return 4;
    }

    /**
     * Agrega un objeto al inventario del personaje (Dar Botín).
     * Valida existencia y restricción de Tier por nivel.
     */
    public PlayerCharacter addItemToInventory(Long characterId, Long itemId) {
        PlayerCharacter character = characterRepo.findById(characterId)
                .orElseThrow(() -> new NoSuchElementException("Personaje no encontrado con id: " + characterId));

        Item item = itemRepo.findById(itemId)
                .orElseThrow(() -> new NoSuchElementException("Item no encontrado con id: " + itemId));

        int maxTier = getMaxAllowedTier(character.getNivel());
        if (item.getTier() > maxTier) {
            throw new IllegalArgumentException(String.format(
                    "El objeto '%s' es Tier %d, pero un personaje de nivel %d solo puede portar objetos hasta Tier %d.",
                    item.getNombre(), item.getTier(), character.getNivel(), maxTier
            ));
        }

        character.getInventario().add(item);
        PlayerCharacter saved = characterRepo.save(character);

        broadcastCharacterUpdate(saved);
        return saved;
    }

    /**
     * Remueve la primera coincidencia del objeto dentro del inventario del personaje
     * (permite eliminar consumibles duplicados uno a uno).
     */
    public PlayerCharacter removeItemFromInventory(Long characterId, Long itemId) {
        PlayerCharacter character = characterRepo.findById(characterId)
                .orElseThrow(() -> new NoSuchElementException("Personaje no encontrado con id: " + characterId));

        int indexToRemove = -1;
        for (int i = 0; i < character.getInventario().size(); i++) {
            Item item = character.getInventario().get(i);
            if (item != null && item.getId() != null && item.getId().equals(itemId)) {
                indexToRemove = i;
                break;
            }
        }

        if (indexToRemove == -1) {
            throw new NoSuchElementException("El objeto con id " + itemId + " no se encuentra en el inventario del personaje.");
        }

        character.getInventario().remove(indexToRemove);
        PlayerCharacter saved = characterRepo.save(character);

        broadcastCharacterUpdate(saved);
        return saved;
    }

    /**
     * Conmuta el permiso de subida de nivel otorgado por el DJ (Sprint 22).
     */
    public PlayerCharacter toggleLevelUpPermission(Long id) {
        PlayerCharacter character = characterRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Personaje no encontrado con id: " + id));

        character.setPuedeSubirNivel(!character.isPuedeSubirNivel());
        PlayerCharacter saved = characterRepo.save(character);

        broadcastCharacterUpdate(saved);
        return saved;
    }

    /**
     * Sube de nivel a un personaje aplicando las validaciones de Tier y bolsa de opciones (Sprint 21 y 22).
     */
    public PlayerCharacter levelUp(Long id, LevelUpRequest request) {
        PlayerCharacter character = characterRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Personaje no encontrado con id: " + id));

        if (!character.isPuedeSubirNivel()) {
            throw new IllegalStateException("Subida de nivel no autorizada por el DJ.");
        }

        levelUpService.processLevelUp(character, request);
        character.setPuedeSubirNivel(false);
        PlayerCharacter saved = characterRepo.save(character);

        broadcastCharacterUpdate(saved);
        return saved;
    }

    /**
     * Emite un evento WebSocket CHARACTER_UPDATE a /topic/table con el estado completo del personaje.
     */
    public void broadcastCharacterUpdate(PlayerCharacter character) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("characterId", character.getId());
            payload.put("character", character);
            payload.put("puedeSubirNivel", character.isPuedeSubirNivel());
            payload.put("nivel", character.getNivel());
            payload.put("competencia", character.getCompetencia());
            payload.put("evasion", character.getEvasion());
            payload.put("atributos", character.getAtributos());
            payload.put("experiencias", character.getExperiencias());
            payload.put("cartasActivasIds", character.getCartasActivasIds());
            payload.put("tierProgression", character.getTierProgression());
            payload.put("inventario", character.getInventario());
            payload.put("hpActual", character.getHpActual());
            payload.put("hpMax", character.getHpMax());
            payload.put("estresActual", character.getEstresActual());
            payload.put("estresMax", character.getEstresMax());
            payload.put("esperanzaActual", character.getEsperanzaActual());
            payload.put("ranurasArmaduraMarcadas", character.getRanurasArmaduraMarcadas());
            payload.put("armaPrincipal", character.getArmaPrincipal());
            payload.put("armaSecundaria", character.getArmaSecundaria());
            payload.put("armaduraActiva", character.getArmaduraActiva());

            TableAction action = new TableAction("CHARACTER_UPDATE", character.getNombre(), payload);
            messagingTemplate.convertAndSend("/topic/table", action);
        } catch (Exception e) {
            System.err.println("[CharacterService] Error emitiendo WebSocket CHARACTER_UPDATE: " + e.getMessage());
        }
    }
}
