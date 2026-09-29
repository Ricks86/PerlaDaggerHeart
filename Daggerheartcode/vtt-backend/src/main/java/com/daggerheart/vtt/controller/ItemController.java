package com.daggerheart.vtt.controller;

import com.daggerheart.vtt.model.Item;
import com.daggerheart.vtt.repository.ItemRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ItemController: Controlador REST para operaciones masivas y específicas de ítems polimórficos.
 */
@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "*")
public class ItemController {

    private final ItemRepository itemRepository;

    public ItemController(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @PostMapping("/batch")
    public ResponseEntity<List<Item>> createItemsBatch(@RequestBody List<Item> items) {
        return ResponseEntity.ok(itemRepository.saveAll(items));
    }
}
