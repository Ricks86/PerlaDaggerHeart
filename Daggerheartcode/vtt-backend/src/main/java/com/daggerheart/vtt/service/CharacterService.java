package com.daggerheart.vtt.service;

import com.daggerheart.vtt.dto.CardSwapRequest;
import com.daggerheart.vtt.dto.LevelUpRequest;
import com.daggerheart.vtt.dto.TableAction;
import com.daggerheart.vtt.model.Card;
import com.daggerheart.vtt.model.Item;
import com.daggerheart.vtt.model.PlayerCharacter;
import com.daggerheart.vtt.repository.CardRepository;
import com.daggerheart.vtt.repository.ItemRepository;
import com.daggerheart.vtt.repository.PlayerCharacterRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class CharacterService {

    private final PlayerCharacterRepository characterRepo;
    private final ItemRepository itemRepo;
    private final CardRepository cardRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final LevelUpService levelUpService;

    @Autowired
    public CharacterService(
            PlayerCharacterRepository characterRepo,
            ItemRepository itemRepo,
            CardRepository cardRepo,
            SimpMessagingTemplate messagingTemplate,
            LevelUpService levelUpService) {
        this.characterRepo = characterRepo;
        this.itemRepo = itemRepo;
        this.cardRepo = cardRepo;
        this.messagingTemplate = messagingTemplate;
        this.levelUpService = levelUpService;
    }

    public CharacterService(
            PlayerCharacterRepository characterRepo,
            ItemRepository itemRepo,
            SimpMessagingTemplate messagingTemplate,
            LevelUpService levelUpService) {
        this(characterRepo, itemRepo, null, messagingTemplate, levelUpService);
    }

    /**
     * Calcula el Tier máximo permitido según el nivel del personaje:
     * - Nivel 1 → Tier 1
     * - Niveles 2 al 4 → Tier 2 o inferior
     * - Niveles 5 al 7 → Tier 3 o inferior
     * - Niveles 8 al 10 → Tier 4 o inferior
     */
    public int getMaxAllowedTier(int nivel) {
        if (nivel <= 1)
            return 1;
        if (nivel <= 4)
            return 2;
        if (nivel <= 7)
            return 3;
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
                    item.getNombre(), item.getTier(), character.getNivel(), maxTier));
        }

        if (character.getInventario().size() >= 20) {
            throw new IllegalArgumentException("El inventario del personaje está lleno (máximo 20 objetos).");
        }

        character.getInventario().add(item);
        PlayerCharacter saved = characterRepo.save(character);

        broadcastCharacterUpdate(saved);
        return saved;
    }

    /**
     * Remueve la primera coincidencia del objeto dentro del inventario del
     * personaje
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
            throw new NoSuchElementException(
                    "El objeto con id " + itemId + " no se encuentra en el inventario del personaje.");
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
     * Sube de nivel a un personaje aplicando las validaciones de Tier y bolsa de
     * opciones (Sprint 21 y 22).
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
     * Actualiza las notas personales del aventurero (Sprint 22).
     */
    public PlayerCharacter updateNotes(Long id, String notas) {
        PlayerCharacter character = characterRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Personaje no encontrado con id: " + id));

        character.setNotas(notas != null ? notas : "");
        PlayerCharacter saved = characterRepo.save(character);

        broadcastCharacterUpdate(saved);
        return saved;
    }

    /**
     * Calcula el Coste de Recuperación de una carta de dominio desde su metadata
     * JSON (Sprint 26).
     */
    public int getCardRecoveryCost(Card card) {
        if (card == null || card.getMetadata() == null || card.getMetadata().isBlank()) {
            return 0;
        }
        try {
            JsonNode root = new ObjectMapper().readTree(card.getMetadata());
            if (root.has("coste_recuperacion")) {
                return root.get("coste_recuperacion").asInt(0);
            }
            if (root.has("costeRecuperacion")) {
                return root.get("costeRecuperacion").asInt(0);
            }
            if (root.has("recuperacion")) {
                return root.get("recuperacion").asInt(0);
            }
        } catch (Exception e) {
            // Ignorar error de parseo y retornar 0
        }
        return 0;
    }

    /**
     * Determina si una carta es de tipo Dominio o habilidad asociada.
     * Las cartas de tipo 'Homebrew' o marcadas como esHomebrew quedan
     * explícitamente excluidas,
     * actuando como modificadores externos sin ocupar hueco de loadout ni bóveda.
     */
    public boolean isDomainCard(Card c) {
        if (c == null)
            return false;
        if ("Homebrew".equalsIgnoreCase(c.getTipo()) || c.isEsHomebrew())
            return false;
        if (c.getMetadata() != null) {
            if (c.getMetadata().contains("\"es_homebrew\":true") || c.getMetadata().contains("\"esHomebrew\":true")) {
                return false;
            }
        }
        if ("Dominio".equalsIgnoreCase(c.getTipo()))
            return true;
        if (c.getMetadata() != null && c.getMetadata().contains("\"dominio\":"))
            return true;
        return false;
    }

    /**
     * Sincroniza la lista plana de IDs cartasActivasIds con las cartas equipadas en
     * loadout,
     * preservando además cualquier carta de trasfondo (Clase, Linaje, Comunidad) y
     * cartas Homebrew.
     */
    public void syncCartasActivasIds(PlayerCharacter character) {
        if (character == null)
            return;
        List<Long> loadoutIds = character.getLoadout().stream()
                .map(Card::getId)
                .filter(Objects::nonNull)
                .toList();

        List<Long> existingOtherIds = new ArrayList<>();
        if (character.getCartasActivasIds() != null && cardRepo != null) {
            List<Card> existing = cardRepo.findAllById(character.getCartasActivasIds());
            for (Card c : existing) {
                if (!isDomainCard(c) && c.getId() != null) {
                    existingOtherIds.add(c.getId());
                }
            }
        }
        Set<Long> combined = new LinkedHashSet<>(existingOtherIds);
        combined.addAll(loadoutIds);
        character.setCartasActivasIds(new ArrayList<>(combined));
    }

    /**
     * Inicializa loadout y boveda a partir de cartasActivasIds si estaban vacíos
     * (migración transparente).
     * Solo asigna cartas de Dominio al Loadout (máx 5) y Bóveda.
     * Limpia cartas no-dominio (ej: Homebrew o trasfondo) que pudieran haber
     * quedado erróneamente en el loadout.
     */
    public void ensureLoadoutInitialized(PlayerCharacter character) {
        if (character == null || cardRepo == null)
            return;

        // Limpiar del loadout y de la bóveda cualquier carta que no sea de dominio (ej.
        // Homebrew o trasfondo)
        boolean loadoutCleaned = character.getLoadout().removeIf(c -> !isDomainCard(c));
        boolean bovedaCleaned = character.getBoveda().removeIf(c -> !isDomainCard(c));

        if (character.getLoadout().isEmpty() && character.getBoveda().isEmpty()
                && !character.getCartasActivasIds().isEmpty()) {
            List<Card> resolved = cardRepo.findAllById(character.getCartasActivasIds());
            for (Card c : resolved) {
                if (isDomainCard(c)) {
                    if (character.getLoadout().size() < 5) {
                        character.getLoadout().add(c);
                    } else {
                        character.getBoveda().add(c);
                    }
                }
            }
            syncCartasActivasIds(character);
            if (character.getId() != null && characterRepo != null) {
                characterRepo.save(character);
            }
        } else if (loadoutCleaned || bovedaCleaned) {
            syncCartasActivasIds(character);
            if (character.getId() != null && characterRepo != null) {
                characterRepo.save(character);
            }
        }
    }

    /**
     * Intercambia cartas entre la Bóveda y el Loadout aplicando las reglas de
     * negocio de Sprint 26:
     * - Límite de 5 cartas en el Loadout.
     * - Cobro del Coste de Recuperación en estrés si !isFreeSwap (tensión/combate).
     * - Validación de disponibilidad de estrés.
     */
    public PlayerCharacter swapDomainCard(Long characterId, CardSwapRequest request) {
        PlayerCharacter character = characterRepo.findById(characterId)
                .orElseThrow(() -> new NoSuchElementException("Personaje no encontrado con id: " + characterId));

        if (request == null) {
            throw new IllegalArgumentException("La petición de intercambio no puede ser nula.");
        }

        ensureLoadoutInitialized(character);

        Long cardToLoadoutId = request.getCardToLoadoutId();
        Long cardToVaultId = request.getCardToVaultId();
        boolean isFreeSwap = request.isFreeSwap();

        // 1. Caso especial: Desequipar una carta activa a la Bóveda (para liberar
        // espacio en descanso)
        if (cardToLoadoutId == null && cardToVaultId != null) {
            Card cardToVault = character.getLoadout().stream()
                    .filter(c -> c.getId() != null && c.getId().equals(cardToVaultId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("La carta a enviar a la Bóveda (id: "
                            + cardToVaultId + ") no se encuentra en el Loadout activo."));

            character.getLoadout().remove(cardToVault);
            character.getBoveda().add(cardToVault);
            syncCartasActivasIds(character);

            PlayerCharacter saved = characterRepo.save(character);
            broadcastCharacterUpdate(saved);
            return saved;
        }

        if (cardToLoadoutId == null) {
            throw new IllegalArgumentException("Debe especificar la carta de la Bóveda a equipar en el Loadout.");
        }

        // 2. Validar que cardToLoadoutId exista en la bóveda
        Card cardToLoadout = character.getBoveda().stream()
                .filter(c -> c.getId() != null && c.getId().equals(cardToLoadoutId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("La carta seleccionada (id: " + cardToLoadoutId
                        + ") no se encuentra en la Bóveda del personaje."));

        // 3. Validar límite de 5 cartas en loadout
        if (character.getLoadout().size() >= 5 && cardToVaultId == null) {
            throw new IllegalStateException("Loadout lleno. Debes elegir una carta para enviar a la Bóveda.");
        }

        // 4. Validar cardToVault si se especificó
        Card cardToVault = null;
        if (cardToVaultId != null) {
            cardToVault = character.getLoadout().stream()
                    .filter(c -> c.getId() != null && c.getId().equals(cardToVaultId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("La carta a enviar a la Bóveda (id: "
                            + cardToVaultId + ") no se encuentra en el Loadout activo."));
        }

        // 5. Si !isFreeSwap (intercambio en combate/tensión), verificar y cobrar estrés
        if (!isFreeSwap) {
            int costeRecuperacion = getCardRecoveryCost(cardToLoadout);
            if (character.getEstresActual() + costeRecuperacion > character.getEstresMax()) {
                throw new IllegalStateException(
                        "No tienes suficiente espacio de estrés para pagar el Coste de Recuperación ("
                                + costeRecuperacion + ").");
            }
            character.setEstresActual(character.getEstresActual() + costeRecuperacion);
        }

        // 6. Ejecutar movimiento
        character.getBoveda().remove(cardToLoadout);
        if (cardToVault != null) {
            character.getLoadout().remove(cardToVault);
            character.getBoveda().add(cardToVault);
        }
        character.getLoadout().add(cardToLoadout);

        syncCartasActivasIds(character);
        PlayerCharacter saved = characterRepo.save(character);
        broadcastCharacterUpdate(saved);
        return saved;
    }

    /**
     * Emite un evento WebSocket CHARACTER_UPDATE a /topic/table con el estado
     * completo del personaje.
     */
    public void broadcastCharacterUpdate(PlayerCharacter character) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("characterId", character.getId());
            payload.put("character", character);
            payload.put("puedeSubirNivel", character.isPuedeSubirNivel());
            payload.put("notas", character.getNotas());
            payload.put("nivel", character.getNivel());
            payload.put("competencia", character.getCompetencia());
            payload.put("evasion", character.getEvasion());
            payload.put("atributos", character.getAtributos());
            payload.put("experiencias", character.getExperiencias());
            payload.put("cartasActivasIds", character.getCartasActivasIds());
            payload.put("loadout", character.getLoadout());
            payload.put("boveda", character.getBoveda());
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
