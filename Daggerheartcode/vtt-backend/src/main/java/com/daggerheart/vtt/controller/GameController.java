package com.daggerheart.vtt.controller;

import com.daggerheart.vtt.model.*;
import com.daggerheart.vtt.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * GameController: expone la capa de datos del juego como API REST.
 *
 * @CrossOrigin permisivo para desarrollo (React en puerto 3000 ↔ Spring en 8080).
 * En producción se restringiría al dominio específico.
 *
 * Endpoints disponibles:
 *   GET /api/characters/{id}  → Personaje por ID
 *   GET /api/cards            → Todas las cartas
 *   GET /api/items            → Todos los ítems
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

    /** Lista todos los personajes creados. */
    @GetMapping("/characters")
    public List<PlayerCharacter> getAllCharacters() {
        return characterRepo.findAll();
    }

    /** Obtiene un personaje por su ID. Devuelve 404 si no existe. */
    @GetMapping("/characters/{id}")
    public ResponseEntity<PlayerCharacter> getCharacter(@PathVariable Long id) {
        return characterRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Crea un nuevo personaje. */
    @PostMapping("/characters")
    public ResponseEntity<PlayerCharacter> createCharacter(@RequestBody PlayerCharacter character) {
        PlayerCharacter saved = characterRepo.save(character);
        return ResponseEntity.ok(saved);
    }

    /** Actualiza un personaje existente (atributos, cartas activas, etc.). */
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
            if (details.getInventarioIds() != null) {
                pc.getInventarioIds().clear();
                pc.getInventarioIds().addAll(details.getInventarioIds());
            }
            if (details.getCartasActivasIds() != null) {
                pc.getCartasActivasIds().clear();
                pc.getCartasActivasIds().addAll(details.getCartasActivasIds());
            }
            return ResponseEntity.ok(characterRepo.save(pc));
        }).orElse(ResponseEntity.notFound().build());
    }


    // -------------------------------------------------------------------------
    // Cartas
    // -------------------------------------------------------------------------

    /** Lista todas las cartas disponibles en la campaña. */
    @GetMapping("/cards")
    public List<Card> getAllCards() {
        return cardRepo.findAll();
    }

    /** Crea una nueva carta en el compendio. */
    @PostMapping("/cards")
    public ResponseEntity<Card> createCard(@RequestBody Card card) {
        Card saved = cardRepo.save(card);
        return ResponseEntity.ok(saved);
    }

    /**
     * Ingesta masiva (Bulk Import) de cartas.
     * Inserta una lista completa de entidades Card mediante saveAll.
     */
    @PostMapping("/cards/bulk")
    public ResponseEntity<Map<String, Object>> bulkImportCards(@RequestBody List<Card> cards) {
        List<Card> saved = cardRepo.saveAll(cards);
        Map<String, Object> response = new HashMap<>();
        response.put("count", saved.size());
        response.put("message", "Se han insertado " + saved.size() + " cartas con éxito.");
        return ResponseEntity.ok(response);
    }


    /** Elimina una carta del compendio por su ID. */
    @DeleteMapping("/cards/{id}")
    public ResponseEntity<Void> deleteCard(@PathVariable Long id) {
        if (!cardRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        cardRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }


    // -------------------------------------------------------------------------
    // Ítems
    // -------------------------------------------------------------------------

    /** Lista todos los ítems del inventario global. */
    @GetMapping("/items")
    public List<Item> getAllItems() {
        return itemRepo.findAll();
    }

    // -------------------------------------------------------------------------
    // Adversarios (DJ)
    // -------------------------------------------------------------------------

    /** Lista todos los adversarios/NPCs (acceso exclusivo del DJ). */
    @GetMapping("/adversaries")
    public List<Adversary> getAllAdversaries() {
        return adversaryRepo.findAll();
    }
}
