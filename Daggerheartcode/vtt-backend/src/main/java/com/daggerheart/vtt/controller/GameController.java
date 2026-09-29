package com.daggerheart.vtt.controller;

import com.daggerheart.vtt.model.*;
import com.daggerheart.vtt.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * GameController: expone la capa de datos del juego como API REST.
 *
 * Endpoints disponibles:
 *   GET /api/characters       → Todos los personajes
 *   GET /api/characters/{id}  → Personaje por ID
 *   POST /api/characters      → Crear personaje
 *   PUT /api/characters/{id}   → Actualizar personaje completo
 *   PATCH /api/characters/{id}/equipment → Equipar / Desequipar items
 *   GET /api/cards            → Todas las cartas
 *   POST /api/cards           → Crear carta
 *   POST /api/cards/bulk      → Ingesta masiva de cartas
 *   DELETE /api/cards/{id}    → Eliminar carta
 *   GET /api/items            → Todos los ítems polimórficos
 *   GET /api/adversaries      → Todos los adversarios (DJ)
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GameController {

    private final PlayerCharacterRepository characterRepo;
    private final CardRepository cardRepo;
    private final ItemRepository itemRepo;
    private final AdversaryRepository adversaryRepo;

    public GameController(
            PlayerCharacterRepository characterRepo,
            CardRepository cardRepo,
            ItemRepository itemRepo,
            AdversaryRepository adversaryRepo) {
        this.characterRepo = characterRepo;
        this.cardRepo = cardRepo;
        this.itemRepo = itemRepo;
        this.adversaryRepo = adversaryRepo;
    }

    // -------------------------------------------------------------------------
    // Personajes
    // -------------------------------------------------------------------------

    @GetMapping("/characters")
    public List<PlayerCharacter> getAllCharacters() {
        return characterRepo.findAll();
    }

    @GetMapping("/characters/{id}")
    public ResponseEntity<PlayerCharacter> getCharacter(@PathVariable Long id) {
        return characterRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/characters")
    public ResponseEntity<PlayerCharacter> createCharacter(@RequestBody PlayerCharacter character) {
        if (character.getArmaPrincipal() != null && character.getArmaPrincipal().getId() != null) {
            itemRepo.findById(character.getArmaPrincipal().getId())
                    .filter(it -> it instanceof Arma)
                    .map(it -> (Arma) it)
                    .ifPresent(character::setArmaPrincipal);
        }
        if (character.getArmaSecundaria() != null && character.getArmaSecundaria().getId() != null) {
            itemRepo.findById(character.getArmaSecundaria().getId())
                    .filter(it -> it instanceof Arma)
                    .map(it -> (Arma) it)
                    .ifPresent(character::setArmaSecundaria);
        }
        if (character.getArmaduraActiva() != null && character.getArmaduraActiva().getId() != null) {
            itemRepo.findById(character.getArmaduraActiva().getId())
                    .filter(it -> it instanceof Armadura)
                    .map(it -> (Armadura) it)
                    .ifPresent(character::setArmaduraActiva);
        }
        if (character.getInventario() != null && !character.getInventario().isEmpty()) {
            Set<Item> resolvedInv = new LinkedHashSet<>();
            for (Item invItem : character.getInventario()) {
                if (invItem != null && invItem.getId() != null) {
                    itemRepo.findById(invItem.getId()).ifPresent(resolvedInv::add);
                }
            }
            character.setInventario(resolvedInv);
        }

        PlayerCharacter saved = characterRepo.save(character);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/characters/{id}")
    public ResponseEntity<PlayerCharacter> updateCharacter(@PathVariable Long id, @RequestBody PlayerCharacter details) {
        return characterRepo.findById(id).map(pc -> {
            pc.setNombre(details.getNombre());
            pc.setNivel(details.getNivel());
            pc.setClase(details.getClase());
            pc.setSubclase(details.getSubclase());
            pc.setAncestro(details.getAncestro());
            pc.setComunidad(details.getComunidad());
            pc.setCompetencia(details.getCompetencia());
            pc.setHpActual(details.getHpActual());
            pc.setHpMax(details.getHpMax());
            pc.setEstresActual(details.getEstresActual());
            pc.setEstresMax(details.getEstresMax());
            pc.setEsperanzaActual(details.getEsperanzaActual());
            pc.setEsperanzaMax(details.getEsperanzaMax());
            pc.setEvasion(details.getEvasion());

            if (details.getAtributos() != null) pc.setAtributos(details.getAtributos());
            if (details.getOro() != null) pc.setOro(details.getOro());
            if (details.getExperiencias() != null) {
                pc.getExperiencias().clear();
                pc.getExperiencias().addAll(details.getExperiencias());
            }
            if (details.getCartasActivasIds() != null) {
                pc.getCartasActivasIds().clear();
                pc.getCartasActivasIds().addAll(details.getCartasActivasIds());
            }

            // Sprint 11: Equipamiento e inventario
            pc.setArmaPrincipal(details.getArmaPrincipal());
            pc.setArmaSecundaria(details.getArmaSecundaria());
            pc.setArmaduraActiva(details.getArmaduraActiva());
            if (details.getInventario() != null) {
                pc.getInventario().clear();
                pc.getInventario().addAll(details.getInventario());
            }

            return ResponseEntity.ok(characterRepo.save(pc));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * PATCH /api/characters/{id}/equipment
     * Permite equipar o desequipar armas y armaduras de forma atómica.
     * Soporta:
     *   - { "action": "EQUIP", "slot": "armaPrincipal"|"armaSecundaria"|"armaduraActiva", "itemId": 123 }
     *   - { "action": "UNEQUIP", "slot": "armaPrincipal"|"armaSecundaria"|"armaduraActiva" }
     */
    @PatchMapping("/characters/{id}/equipment")
    public ResponseEntity<PlayerCharacter> manageEquipment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        return characterRepo.findById(id).map(pc -> {
            String action = (String) payload.getOrDefault("action", "EQUIP");
            String slot = (String) payload.get("slot");

            if ("UNEQUIP".equalsIgnoreCase(action)) {
                if ("armaPrincipal".equals(slot) && pc.getArmaPrincipal() != null) {
                    pc.getInventario().add(pc.getArmaPrincipal());
                    pc.setArmaPrincipal(null);
                } else if ("armaSecundaria".equals(slot) && pc.getArmaSecundaria() != null) {
                    pc.getInventario().add(pc.getArmaSecundaria());
                    pc.setArmaSecundaria(null);
                } else if ("armaduraActiva".equals(slot) && pc.getArmaduraActiva() != null) {
                    pc.getInventario().add(pc.getArmaduraActiva());
                    pc.setArmaduraActiva(null);
                }
            } else if ("EQUIP".equalsIgnoreCase(action)) {
                Object rawItemId = payload.get("itemId");
                if (rawItemId != null) {
                    Long itemId = Long.valueOf(rawItemId.toString());
                    Item item = itemRepo.findById(itemId).orElse(null);

                    if (item instanceof Arma arma) {
                        if ("armaPrincipal".equals(slot)) {
                            if (pc.getArmaPrincipal() != null) {
                                pc.getInventario().add(pc.getArmaPrincipal());
                            }
                            pc.setArmaPrincipal(arma);
                            pc.getInventario().remove(arma);

                            // Regla de Carga: Si carga == 2, desequipar arma secundaria
                            if (arma.getCarga() == 2 && pc.getArmaSecundaria() != null) {
                                pc.getInventario().add(pc.getArmaSecundaria());
                                pc.setArmaSecundaria(null);
                            }
                        } else if ("armaSecundaria".equals(slot)) {
                            // Solo se puede equipar si el arma principal no ocupa 2 manos
                            if (pc.getArmaPrincipal() == null || pc.getArmaPrincipal().getCarga() < 2) {
                                if (pc.getArmaSecundaria() != null) {
                                    pc.getInventario().add(pc.getArmaSecundaria());
                                }
                                pc.setArmaSecundaria(arma);
                                pc.getInventario().remove(arma);
                            }
                        }
                    } else if (item instanceof Armadura armadura) {
                        if ("armaduraActiva".equals(slot)) {
                            if (pc.getArmaduraActiva() != null) {
                                pc.getInventario().add(pc.getArmaduraActiva());
                            }
                            pc.setArmaduraActiva(armadura);
                            pc.getInventario().remove(armadura);
                        }
                    }
                }
            }

            return ResponseEntity.ok(characterRepo.save(pc));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * PATCH /api/characters/{id} genérico
     */
    @PatchMapping("/characters/{id}")
    public ResponseEntity<PlayerCharacter> patchCharacter(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        return characterRepo.findById(id).map(pc -> {
            if (updates.containsKey("hpActual")) {
                pc.setHpActual(((Number) updates.get("hpActual")).intValue());
            }
            if (updates.containsKey("estresActual")) {
                pc.setEstresActual(((Number) updates.get("estresActual")).intValue());
            }
            if (updates.containsKey("esperanzaActual")) {
                pc.setEsperanzaActual(((Number) updates.get("esperanzaActual")).intValue());
            }
            return ResponseEntity.ok(characterRepo.save(pc));
        }).orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // Cartas
    // -------------------------------------------------------------------------

    @GetMapping("/cards")
    public List<Card> getAllCards() {
        return cardRepo.findAll();
    }

    @PostMapping("/cards")
    public ResponseEntity<Card> createCard(@RequestBody Card card) {
        return ResponseEntity.ok(cardRepo.save(card));
    }

    @PostMapping("/cards/bulk")
    public ResponseEntity<Map<String, Object>> bulkImportCards(@RequestBody List<Card> cards) {
        List<Card> saved = cardRepo.saveAll(cards);
        Map<String, Object> response = new HashMap<>();
        response.put("count", saved.size());
        response.put("message", "Se han insertado " + saved.size() + " cartas con éxito.");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/cards/{id}")
    public ResponseEntity<Void> deleteCard(@PathVariable Long id) {
        if (!cardRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        cardRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // Ítems (Polimórficos: Arma, Armadura, Consumible)
    // -------------------------------------------------------------------------

    @GetMapping("/items")
    public List<Item> getAllItems() {
        return itemRepo.findAll();
    }

    @PostMapping("/items")
    public ResponseEntity<Item> createItem(@RequestBody Item item) {
        return ResponseEntity.ok(itemRepo.save(item));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        if (!itemRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        itemRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // Adversarios (DJ)
    // -------------------------------------------------------------------------

    @GetMapping("/adversaries")
    public List<Adversary> getAllAdversaries() {
        return adversaryRepo.findAll();
    }
}
