package com.daggerheart.vtt;

import com.daggerheart.vtt.dto.SpawnAdversaryRequest;
import com.daggerheart.vtt.dto.UpdateAdversaryStatusRequest;
import com.daggerheart.vtt.model.ActiveAdversary;
import com.daggerheart.vtt.model.AdversaryTemplate;
import com.daggerheart.vtt.repository.ActiveAdversaryRepository;
import com.daggerheart.vtt.repository.AdversaryTemplateRepository;
import com.daggerheart.vtt.service.EncounterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class EncounterServiceTest {

    private AdversaryTemplateRepository templateRepo;
    private ActiveAdversaryRepository activeRepo;
    private SimpMessagingTemplate messagingTemplate;
    private EncounterService encounterService;

    private List<ActiveAdversary> activeDatabase;
    private List<AdversaryTemplate> templateDatabase;
    private long idSeq = 1L;

    @BeforeEach
    public void setUp() {
        templateRepo = Mockito.mock(AdversaryTemplateRepository.class);
        activeRepo = Mockito.mock(ActiveAdversaryRepository.class);
        messagingTemplate = Mockito.mock(SimpMessagingTemplate.class);

        activeDatabase = new ArrayList<>();
        templateDatabase = new ArrayList<>();
        idSeq = 1L;

        // Mock activeRepo
        when(activeRepo.findAllByOrderByIdAsc()).thenAnswer(inv -> new ArrayList<>(activeDatabase));
        when(activeRepo.count()).thenAnswer(inv -> (long) activeDatabase.size());
        when(activeRepo.save(any(ActiveAdversary.class))).thenAnswer(inv -> {
            ActiveAdversary a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId(idSeq++);
                activeDatabase.add(a);
            } else {
                for (int i = 0; i < activeDatabase.size(); i++) {
                    if (activeDatabase.get(i).getId().equals(a.getId())) {
                        activeDatabase.set(i, a);
                        break;
                    }
                }
            }
            return a;
        });
        when(activeRepo.findById(any(Long.class))).thenAnswer(inv -> {
            Long id = inv.getArgument(0);
            return activeDatabase.stream().filter(a -> a.getId().equals(id)).findFirst();
        });
        when(activeRepo.existsById(any(Long.class))).thenAnswer(inv -> {
            Long id = inv.getArgument(0);
            return activeDatabase.stream().anyMatch(a -> a.getId().equals(id));
        });

        // Mock templateRepo
        when(templateRepo.findAll()).thenAnswer(inv -> new ArrayList<>(templateDatabase));
        when(templateRepo.findById(any(Long.class))).thenAnswer(inv -> {
            Long id = inv.getArgument(0);
            return templateDatabase.stream().filter(t -> t.getId().equals(id)).findFirst();
        });
        when(templateRepo.save(any(AdversaryTemplate.class))).thenAnswer(inv -> {
            AdversaryTemplate t = inv.getArgument(0);
            if (t.getId() == null) {
                t.setId(idSeq++);
                templateDatabase.add(t);
            }
            return t;
        });

        encounterService = new EncounterService(templateRepo, activeRepo, messagingTemplate);
    }

    @Test
    public void testSpawnSingleAdversaryUsesBaseName() {
        SpawnAdversaryRequest req = new SpawnAdversaryRequest();
        req.setNombre("Bandido");
        req.setCantidad(1);
        req.setHpMaximo(5);
        req.setEstresMaximo(3);

        List<ActiveAdversary> spawned = encounterService.spawnAdversaries(req);

        assertEquals(1, spawned.size());
        assertEquals("Bandido", spawned.get(0).getNombreInstancia());
        assertEquals(5, spawned.get(0).getHpActual());
        assertEquals(5, spawned.get(0).getHpMaximo());
        assertEquals(0, spawned.get(0).getEstresActual());
        assertEquals(3, spawned.get(0).getEstresMaximo());
    }

    @Test
    public void testSpawnMultipleAdversariesAutoNumbering() {
        SpawnAdversaryRequest req = new SpawnAdversaryRequest();
        req.setNombre("Trasgo");
        req.setCantidad(3);
        req.setHpMaximo(4);

        List<ActiveAdversary> spawned = encounterService.spawnAdversaries(req);

        assertEquals(3, spawned.size());
        assertEquals("Trasgo N°1", spawned.get(0).getNombreInstancia());
        assertEquals("Trasgo N°2", spawned.get(1).getNombreInstancia());
        assertEquals("Trasgo N°3", spawned.get(2).getNombreInstancia());
    }

    @Test
    public void testSpawnCorrelativeNumberingWhenExisting() {
        // Inicialmente creamos 1 "Esqueleto" sin número
        SpawnAdversaryRequest req1 = new SpawnAdversaryRequest();
        req1.setNombre("Esqueleto");
        req1.setCantidad(1);
        encounterService.spawnAdversaries(req1);

        assertEquals(1, activeDatabase.size());
        assertEquals("Esqueleto", activeDatabase.get(0).getNombreInstancia());

        // Ahora invocamos 2 más del mismo nombre
        SpawnAdversaryRequest req2 = new SpawnAdversaryRequest();
        req2.setNombre("Esqueleto");
        req2.setCantidad(2);
        List<ActiveAdversary> secondBatch = encounterService.spawnAdversaries(req2);

        assertEquals(3, activeDatabase.size());
        // El primero debió actualizarse a N°1
        assertEquals("Esqueleto N°1", activeDatabase.get(0).getNombreInstancia());
        // Los nuevos deben ser N°2 y N°3
        assertEquals(2, secondBatch.size());
        assertEquals("Esqueleto N°2", secondBatch.get(0).getNombreInstancia());
        assertEquals("Esqueleto N°3", secondBatch.get(1).getNombreInstancia());
    }

    @Test
    public void testMax15AdversariesLimitEnforced() {
        // Agregamos 14 adversarios
        for (int i = 0; i < 14; i++) {
            ActiveAdversary a = new ActiveAdversary();
            a.setId(idSeq++);
            a.setNombreInstancia("Zombi N°" + (i + 1));
            activeDatabase.add(a);
        }

        assertEquals(14, activeDatabase.size());

        // Intentar invocar 2 más debe lanzar IllegalArgumentException (14 + 2 = 16 > 15)
        SpawnAdversaryRequest req = new SpawnAdversaryRequest();
        req.setNombre("Zombi");
        req.setCantidad(2);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            encounterService.spawnAdversaries(req);
        });

        assertTrue(ex.getMessage().contains("No se pueden tener más de 15"));

        // En cambio, invocar 1 más (14 + 1 = 15) debe ser exitoso
        req.setCantidad(1);
        assertDoesNotThrow(() -> {
            encounterService.spawnAdversaries(req);
        });
        assertEquals(15, activeDatabase.size());
    }

    @Test
    public void testUpdateStatusHpAndStressClamping() {
        ActiveAdversary adv = new ActiveAdversary();
        adv.setId(10L);
        adv.setNombreInstancia("Jefe Ogro");
        adv.setHpMaximo(10);
        adv.setHpActual(10);
        adv.setEstresMaximo(5);
        adv.setEstresActual(0);
        activeDatabase.add(adv);

        // Caso 1: Reducir HP a 4
        UpdateAdversaryStatusRequest req1 = new UpdateAdversaryStatusRequest(4, 2);
        ActiveAdversary updated1 = encounterService.updateStatus(10L, req1);
        assertEquals(4, updated1.getHpActual());
        assertEquals(2, updated1.getEstresActual());

        // Caso 2: Intento de sobrepasar HP (clamping a max 10)
        UpdateAdversaryStatusRequest req2 = new UpdateAdversaryStatusRequest(20, null);
        ActiveAdversary updated2 = encounterService.updateStatus(10L, req2);
        assertEquals(10, updated2.getHpActual());

        // Caso 3: Intento de HP negativo (clamping a 0, estado derrotado)
        UpdateAdversaryStatusRequest req3 = new UpdateAdversaryStatusRequest(-5, null);
        ActiveAdversary updated3 = encounterService.updateStatus(10L, req3);
        assertEquals(0, updated3.getHpActual());

        // Caso 4: Clamping de Estrés excesivo (clamping a max 5)
        UpdateAdversaryStatusRequest req4 = new UpdateAdversaryStatusRequest(null, 99);
        ActiveAdversary updated4 = encounterService.updateStatus(10L, req4);
        assertEquals(5, updated4.getEstresActual());
    }

    @Test
    public void testSpawnFromCompendiumTemplate() {
        AdversaryTemplate tpl = new AdversaryTemplate(
                "Líder Bandido", 2, "Líder", "Difícil",
                8, 4, 10, 18, 3, "1d10+3", "Reacción Táctica"
        );
        tpl.setId(100L);
        templateDatabase.add(tpl);

        SpawnAdversaryRequest req = new SpawnAdversaryRequest();
        req.setTemplateId(100L);
        req.setCantidad(1);

        List<ActiveAdversary> spawned = encounterService.spawnAdversaries(req);

        assertEquals(1, spawned.size());
        ActiveAdversary inst = spawned.get(0);
        assertEquals("Líder Bandido", inst.getNombreInstancia());
        assertEquals(100L, inst.getTemplateId());
        assertEquals(2, inst.getTier());
        assertEquals("Líder", inst.getRango());
        assertEquals("Difícil", inst.getDificultad());
        assertEquals(8, inst.getHpMaximo());
        assertEquals(8, inst.getHpActual());
        assertEquals(4, inst.getEstresMaximo());
        assertEquals(0, inst.getEstresActual());
        assertEquals("1d10+3", inst.getDanoEstandar());
        assertEquals("Reacción Táctica", inst.getRasgosEspeciales());
    }
}
