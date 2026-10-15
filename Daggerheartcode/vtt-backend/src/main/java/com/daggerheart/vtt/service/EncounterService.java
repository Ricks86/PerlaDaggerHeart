package com.daggerheart.vtt.service;

import com.daggerheart.vtt.dto.SpawnAdversaryRequest;
import com.daggerheart.vtt.dto.TableAction;
import com.daggerheart.vtt.dto.UpdateAdversaryStatusRequest;
import com.daggerheart.vtt.model.ActiveAdversary;
import com.daggerheart.vtt.model.AdversaryTemplate;
import com.daggerheart.vtt.repository.ActiveAdversaryRepository;
import com.daggerheart.vtt.repository.AdversaryTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class EncounterService {

    private static final Logger logger = LoggerFactory.getLogger(EncounterService.class);
    public static final int MAX_ACTIVE_ADVERSARIES = 15;

    private final AdversaryTemplateRepository templateRepo;
    private final ActiveAdversaryRepository activeRepo;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public EncounterService(
            AdversaryTemplateRepository templateRepo,
            ActiveAdversaryRepository activeRepo,
            SimpMessagingTemplate messagingTemplate) {
        this.templateRepo = templateRepo;
        this.activeRepo = activeRepo;
        this.messagingTemplate = messagingTemplate;
    }

    // =========================================================================
    // Active Adversaries (Escena de Combate)
    // =========================================================================

    public List<ActiveAdversary> getActiveAdversaries() {
        return activeRepo.findAllByOrderByIdAsc();
    }

    public List<ActiveAdversary> spawnAdversaries(SpawnAdversaryRequest request) {
        int cantidad = (request.getCantidad() != null && request.getCantidad() > 0) ? request.getCantidad() : 1;
        long currentCount = activeRepo.count();

        if (currentCount + cantidad > MAX_ACTIVE_ADVERSARIES) {
            throw new IllegalArgumentException(String.format(
                    "No se pueden tener más de %d adversarios activos simultáneamente (actuales: %d, solicitados: %d).",
                    MAX_ACTIVE_ADVERSARIES, currentCount, cantidad
            ));
        }

        AdversaryTemplate template = null;
        if (request.getTemplateId() != null) {
            template = templateRepo.findById(request.getTemplateId())
                    .orElseThrow(() -> new NoSuchElementException("Plantilla de adversario no encontrada con id: " + request.getTemplateId()));
        }

        String rawNombre = request.getNombre() != null && !request.getNombre().isBlank()
                ? request.getNombre().trim()
                : (template != null ? template.getNombre() : "Enemigo");

        // Extraer nombre base eliminando sufijo numérico previo si existiera
        Pattern cleanupPattern = Pattern.compile("^(.*?)(?:\\s+N°\\d+)?$", Pattern.CASE_INSENSITIVE);
        Matcher cleanupMatcher = cleanupPattern.matcher(rawNombre);
        String baseNombre = cleanupMatcher.matches() ? cleanupMatcher.group(1).trim() : rawNombre;

        Integer tier = request.getTier() != null ? request.getTier() : (template != null ? template.getTier() : 1);
        String rango = request.getRango() != null ? request.getRango() : (template != null ? template.getRango() : "Estándar");
        String dificultad = request.getDificultad() != null ? request.getDificultad() : (template != null ? template.getDificultad() : "Moderado");
        Integer hpMax = request.getHpMaximo() != null ? request.getHpMaximo() : (template != null ? template.getHpMaximo() : 4);
        Integer estresMax = request.getEstresMaximo() != null ? request.getEstresMaximo() : (template != null ? template.getEstresMaximo() : 3);
        Integer umbralMayor = request.getUmbralMayor() != null ? request.getUmbralMayor() : (template != null ? template.getUmbralMayor() : 8);
        Integer umbralGrave = request.getUmbralGrave() != null ? request.getUmbralGrave() : (template != null ? template.getUmbralGrave() : 15);
        Integer modAtaque = request.getModAtaque() != null ? request.getModAtaque() : (template != null ? template.getModAtaque() : 2);
        String danoEstandar = request.getDanoEstandar() != null ? request.getDanoEstandar() : (template != null ? template.getDanoEstandar() : "1d8+2");
        String rasgosEspeciales = request.getRasgosEspeciales() != null ? request.getRasgosEspeciales() : (template != null ? template.getRasgosEspeciales() : null);

        // Lógica de auto-numeración correlativa
        List<ActiveAdversary> allActive = activeRepo.findAllByOrderByIdAsc();
        Pattern baseMatchPattern = Pattern.compile("^" + Pattern.quote(baseNombre) + "(?:\\s+N°(\\d+))?$", Pattern.CASE_INSENSITIVE);

        List<ActiveAdversary> matching = allActive.stream()
                .filter(a -> baseMatchPattern.matcher(a.getNombreInstancia()).matches())
                .collect(Collectors.toList());

        List<String> assignedNames = new ArrayList<>();

        if (matching.isEmpty()) {
            if (cantidad == 1) {
                assignedNames.add(baseNombre);
            } else {
                for (int i = 1; i <= cantidad; i++) {
                    assignedNames.add(baseNombre + " N°" + i);
                }
            }
        } else {
            int maxFound = 0;
            for (ActiveAdversary m : matching) {
                Matcher matcher = baseMatchPattern.matcher(m.getNombreInstancia());
                if (matcher.matches()) {
                    String numStr = matcher.group(1);
                    if (numStr != null) {
                        try {
                            int num = Integer.parseInt(numStr);
                            if (num > maxFound) maxFound = num;
                        } catch (NumberFormatException ignored) {}
                    } else {
                        // Monstruo sin número existente: renombrar a N°1
                        if (maxFound < 1) maxFound = 1;
                        m.setNombreInstancia(baseNombre + " N°1");
                        activeRepo.save(m);
                    }
                }
            }
            for (int i = 1; i <= cantidad; i++) {
                assignedNames.add(baseNombre + " N°" + (maxFound + i));
            }
        }

        List<ActiveAdversary> created = new ArrayList<>();
        Long tId = template != null ? template.getId() : request.getTemplateId();

        for (String instanceName : assignedNames) {
            ActiveAdversary active = new ActiveAdversary(
                    tId,
                    instanceName,
                    tier,
                    rango,
                    dificultad,
                    hpMax, // hpActual inicia al máximo
                    hpMax,
                    0,     // estresActual inicia en 0
                    estresMax,
                    umbralMayor,
                    umbralGrave,
                    modAtaque,
                    danoEstandar,
                    rasgosEspeciales
            );
            created.add(activeRepo.save(active));
        }

        broadcastEncounterUpdate();
        return created;
    }

    public ActiveAdversary updateStatus(Long id, UpdateAdversaryStatusRequest request) {
        ActiveAdversary active = activeRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Adversario activo no encontrado con id: " + id));

        if (request.getHpActual() != null) {
            int clampedHp = Math.max(0, Math.min(active.getHpMaximo(), request.getHpActual()));
            active.setHpActual(clampedHp);
        }

        if (request.getEstresActual() != null) {
            int clampedEstres = Math.max(0, Math.min(active.getEstresMaximo(), request.getEstresActual()));
            active.setEstresActual(clampedEstres);
        }

        ActiveAdversary saved = activeRepo.save(active);
        broadcastEncounterUpdate();
        return saved;
    }

    public void removeActive(Long id) {
        if (!activeRepo.existsById(id)) {
            throw new NoSuchElementException("Adversario activo no encontrado con id: " + id);
        }
        activeRepo.deleteById(id);
        broadcastEncounterUpdate();
    }

    public void clearEncounter() {
        activeRepo.deleteAll();
        broadcastEncounterUpdate();
    }

    // =========================================================================
    // Compendio de Plantillas (AdversaryTemplate)
    // =========================================================================

    public List<AdversaryTemplate> getAllTemplates() {
        return templateRepo.findAll();
    }

    public AdversaryTemplate getTemplateById(Long id) {
        return templateRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Plantilla de adversario no encontrada con id: " + id));
    }

    public AdversaryTemplate saveTemplate(AdversaryTemplate template) {
        if (template.getId() == null && templateRepo.existsByNombre(template.getNombre())) {
            // Actualizar si ya existe por nombre
            AdversaryTemplate existing = templateRepo.findByNombre(template.getNombre()).orElse(null);
            if (existing != null) {
                template.setId(existing.getId());
            }
        }
        return templateRepo.save(template);
    }

    public void deleteTemplate(Long id) {
        if (!templateRepo.existsById(id)) {
            throw new NoSuchElementException("Plantilla no encontrada con id: " + id);
        }
        templateRepo.deleteById(id);
    }

    public List<AdversaryTemplate> batchSaveTemplates(List<AdversaryTemplate> templates) {
        List<AdversaryTemplate> results = new ArrayList<>();
        for (AdversaryTemplate t : templates) {
            results.add(saveTemplate(t));
        }
        return results;
    }

    // =========================================================================
    // WebSocket Broadcast
    // =========================================================================

    private void broadcastEncounterUpdate() {
        if (messagingTemplate != null) {
            try {
                List<ActiveAdversary> currentScene = activeRepo.findAllByOrderByIdAsc();
                TableAction action = new TableAction("ENCOUNTER_UPDATE", "DM", currentScene);
                messagingTemplate.convertAndSend("/topic/table", action);
            } catch (Exception e) {
                logger.warn("[EncounterService] Error al transmitir ENCOUNTER_UPDATE vía WebSocket: {}", e.getMessage());
            }
        }
    }
}
