package com.daggerheart.vtt.controller;

import com.daggerheart.vtt.dto.SpawnAdversaryRequest;
import com.daggerheart.vtt.dto.UpdateAdversaryStatusRequest;
import com.daggerheart.vtt.model.ActiveAdversary;
import com.daggerheart.vtt.model.AdversaryTemplate;
import com.daggerheart.vtt.service.EncounterService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/encounters")
@CrossOrigin(origins = "*")
public class EncounterController {

    private final EncounterService encounterService;

    public EncounterController(EncounterService encounterService) {
        this.encounterService = encounterService;
    }

    // =========================================================================
    // Escena Activa (ActiveAdversary)
    // =========================================================================

    @GetMapping("/active")
    public List<ActiveAdversary> getActiveAdversaries() {
        return encounterService.getActiveAdversaries();
    }

    @PostMapping("/spawn")
    public ResponseEntity<List<ActiveAdversary>> spawnAdversaries(@RequestBody SpawnAdversaryRequest request) {
        List<ActiveAdversary> spawned = encounterService.spawnAdversaries(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(spawned);
    }

    @PatchMapping("/active/{id}")
    public ResponseEntity<ActiveAdversary> updateAdversaryStatus(
            @PathVariable Long id,
            @RequestBody UpdateAdversaryStatusRequest request) {
        ActiveAdversary updated = encounterService.updateStatus(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/active/{id}")
    public ResponseEntity<Void> removeActiveAdversary(@PathVariable Long id) {
        encounterService.removeActive(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearEncounter() {
        encounterService.clearEncounter();
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Compendio de Plantillas (AdversaryTemplate)
    // =========================================================================

    @GetMapping("/templates")
    public List<AdversaryTemplate> getAllTemplates() {
        return encounterService.getAllTemplates();
    }

    @GetMapping("/templates/{id}")
    public ResponseEntity<AdversaryTemplate> getTemplateById(@PathVariable Long id) {
        return ResponseEntity.ok(encounterService.getTemplateById(id));
    }

    @PostMapping("/templates")
    public ResponseEntity<AdversaryTemplate> saveTemplate(@RequestBody AdversaryTemplate template) {
        AdversaryTemplate saved = encounterService.saveTemplate(template);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        encounterService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/templates/batch")
    public ResponseEntity<List<AdversaryTemplate>> batchSaveTemplates(@RequestBody List<AdversaryTemplate> templates) {
        List<AdversaryTemplate> savedList = encounterService.batchSaveTemplates(templates);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedList);
    }

    // =========================================================================
    // Manejo de Excepciones
    // =========================================================================

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }
}
