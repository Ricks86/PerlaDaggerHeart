package com.daggerheart.vtt.controller;

import com.daggerheart.vtt.model.*;
import com.daggerheart.vtt.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    /**
     * Obtiene un personaje por su ID.
     * Devuelve 404 si no existe.
     */
    @GetMapping("/characters/{id}")
    public ResponseEntity<PlayerCharacter> getCharacter(@PathVariable Long id) {
        return characterRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
