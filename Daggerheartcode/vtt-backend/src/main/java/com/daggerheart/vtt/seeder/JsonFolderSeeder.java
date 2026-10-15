package com.daggerheart.vtt.seeder;

import com.daggerheart.vtt.model.Arma;
import com.daggerheart.vtt.model.Armadura;
import com.daggerheart.vtt.model.Card;
import com.daggerheart.vtt.model.Consumible;
import com.daggerheart.vtt.model.Item;
import com.daggerheart.vtt.model.PlayerCharacter;
import com.daggerheart.vtt.repository.CardRepository;
import com.daggerheart.vtt.repository.ItemRepository;
import com.daggerheart.vtt.repository.PlayerCharacterRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * JsonFolderSeeder: Semillero automático al arrancar Spring Boot.
 *
 * Lee recursivamente los archivos .json ubicados en la carpeta externa configurada
 * en daggerheart.data.folder (por defecto ../Jsons):
 *   - /cartas     -> CardRepository.saveAll(...)
 *   - /items      -> ItemRepository.saveAll(...) con deducción polimórfica Jackson
 *   - /personajes -> PlayerCharacterRepository.saveAll(...)
 *
 * Es seguro e idempotente: si las carpetas están vacías o no existen, omite la siembra con log informativo.
 */
@Component
@Order(10)
public class JsonFolderSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(JsonFolderSeeder.class);

    private final CardRepository cardRepository;
    private final ItemRepository itemRepository;
    private final PlayerCharacterRepository characterRepository;
    private final com.daggerheart.vtt.repository.AdversaryTemplateRepository adversaryTemplateRepository;
    private final ObjectMapper objectMapper;
    private final String jsonFolderPath;

    public JsonFolderSeeder(
            CardRepository cardRepository,
            ItemRepository itemRepository,
            PlayerCharacterRepository characterRepository,
            com.daggerheart.vtt.repository.AdversaryTemplateRepository adversaryTemplateRepository,
            ObjectMapper objectMapper,
            @Value("${daggerheart.data.folder:../Jsons}") String jsonFolderPath) {
        this.cardRepository = cardRepository;
        this.itemRepository = itemRepository;
        this.characterRepository = characterRepository;
        this.adversaryTemplateRepository = adversaryTemplateRepository;
        this.objectMapper = objectMapper;
        this.jsonFolderPath = jsonFolderPath;
    }

    @Override
    public void run(String... args) {
        logger.info("[JsonFolderSeeder] Verificando carpeta externa de JSONs: {}", jsonFolderPath);

        File rootDir = new File(jsonFolderPath);
        if (!rootDir.exists() || !rootDir.isDirectory()) {
            logger.warn("[JsonFolderSeeder] La carpeta raíz '{}' no existe o no es un directorio. Omitiendo siembra.", jsonFolderPath);
            return;
        }

        seedCardsFromFolder(new File(rootDir, "cartas"));
        seedItemsFromFolder(new File(rootDir, "items"));
        seedCharactersFromFolder(new File(rootDir, "personajes"));
        seedAdversariesFromFolder(new File(rootDir, "adversarios"));

        logger.info("[JsonFolderSeeder] ✓ Proceso de semillero externo finalizado.");
    }

    private List<Path> findJsonFilesRecursively(File directory) {
        if (!directory.exists() || !directory.isDirectory()) {
            return List.of();
        }
        try (Stream<Path> stream = Files.walk(directory.toPath())) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().toLowerCase().endsWith(".json"))
                    .sorted()
                    .collect(Collectors.toList());
        } catch (IOException e) {
            logger.error("[JsonFolderSeeder] Error al escanear directorio '{}': {}", directory.getAbsolutePath(), e.getMessage());
            return List.of();
        }
    }

    private boolean isHomebrewPath(Path path) {
        String normalized = path.toString().replace('\\', '/').toLowerCase();
        return normalized.contains("/homebrew/") || normalized.contains("homebrew");
    }

    @Transactional
    public void seedCardsFromFolder(File cartasDir) {
        List<Path> jsonFiles = findJsonFilesRecursively(cartasDir);
        if (jsonFiles.isEmpty()) {
            logger.info("[JsonFolderSeeder] No se encontraron archivos JSON en carpeta 'cartas' ('{}').", cartasDir.getAbsolutePath());
            return;
        }

        int totalLeidos = 0;
        int insertados = 0;
        int actualizados = 0;

        for (Path path : jsonFiles) {
            boolean isHomebrew = isHomebrewPath(path);
            try {
                JsonNode root = objectMapper.readTree(path.toFile());
                List<Card> cardsFromFile = new ArrayList<>();
                if (root.isArray()) {
                    cardsFromFile = objectMapper.convertValue(root, new TypeReference<List<Card>>() {});
                } else if (root.has("cards") && root.get("cards").isArray()) {
                    cardsFromFile = objectMapper.convertValue(root.get("cards"), new TypeReference<List<Card>>() {});
                } else {
                    Card single = objectMapper.treeToValue(root, Card.class);
                    if (single != null) cardsFromFile.add(single);
                }

                totalLeidos += cardsFromFile.size();

                for (Card card : cardsFromFile) {
                    if (card.getTitulo() == null || card.getTitulo().isBlank()) {
                        continue;
                    }
                    if (isHomebrew) {
                        card.setEsHomebrew(true);
                    }

                    Optional<Card> existingOpt = cardRepository.findByTitulo(card.getTitulo());
                    if (existingOpt.isPresent()) {
                        Card existing = existingOpt.get();
                        existing.setTipo(card.getTipo());
                        existing.setNivel(card.getNivel());
                        existing.setDescripcion(card.getDescripcion());
                        existing.setMetadata(card.getMetadata());
                        existing.setEsHomebrew(card.isEsHomebrew());
                        cardRepository.save(existing);
                        actualizados++;
                    } else {
                        card.setId(null);
                        cardRepository.save(card);
                        insertados++;
                    }
                }
                logger.debug("[JsonFolderSeeder] Leído archivo de cartas '{}' -> {} carta(s).", path.getFileName(), cardsFromFile.size());
            } catch (Exception e) {
                logger.error("[JsonFolderSeeder] Error al procesar archivo de cartas '{}': {}", path.getFileName(), e.getMessage());
            }
        }

        logger.info("[JSON Ingestion] Proceso completado: {} leídos, {} insertados, {} actualizados/omitidos.", totalLeidos, insertados, actualizados);
    }

    @Transactional
    public void seedItemsFromFolder(File itemsDir) {
        List<Path> jsonFiles = findJsonFilesRecursively(itemsDir);
        if (jsonFiles.isEmpty()) {
            logger.info("[JsonFolderSeeder] No se encontraron archivos JSON en carpeta 'items' ('{}').", itemsDir.getAbsolutePath());
            return;
        }

        int totalLeidos = 0;
        int insertados = 0;
        int actualizados = 0;

        for (Path path : jsonFiles) {
            boolean isHomebrew = isHomebrewPath(path);
            try {
                JsonNode root = objectMapper.readTree(path.toFile());
                List<Item> itemsFromFile = new ArrayList<>();
                if (root.isArray()) {
                    itemsFromFile = objectMapper.convertValue(root, new TypeReference<List<Item>>() {});
                } else if (root.has("items") && root.get("items").isArray()) {
                    itemsFromFile = objectMapper.convertValue(root.get("items"), new TypeReference<List<Item>>() {});
                } else {
                    Item single = objectMapper.treeToValue(root, Item.class);
                    if (single != null) itemsFromFile.add(single);
                }

                totalLeidos += itemsFromFile.size();

                for (Item item : itemsFromFile) {
                    if (item.getNombre() == null || item.getNombre().isBlank()) {
                        continue;
                    }
                    if (isHomebrew) {
                        item.setEsHomebrew(true);
                    }

                    Optional<Item> existingOpt = itemRepository.findByNombre(item.getNombre());
                    if (existingOpt.isPresent()) {
                        Item existing = existingOpt.get();
                        if (existing instanceof Arma existingArma && item instanceof Arma newArma) {
                            existingArma.setTier(newArma.getTier());
                            existingArma.setEsHomebrew(newArma.isEsHomebrew());
                            existingArma.setCategoria(newArma.getCategoria());
                            existingArma.setRasgo(newArma.getRasgo());
                            existingArma.setDadoBase(newArma.getDadoBase());
                            existingArma.setModificadorDano(newArma.getModificadorDano());
                            existingArma.setTipoDano(newArma.getTipoDano());
                            existingArma.setCarga(newArma.getCarga());
                            existingArma.setAlcance(newArma.getAlcance());
                            existingArma.setRasgoEspecial(newArma.getRasgoEspecial());
                            itemRepository.save(existingArma);
                        } else if (existing instanceof Armadura existingArmadura && item instanceof Armadura newArmadura) {
                            existingArmadura.setTier(newArmadura.getTier());
                            existingArmadura.setEsHomebrew(newArmadura.isEsHomebrew());
                            existingArmadura.setPuntuacionBase(newArmadura.getPuntuacionBase());
                            existingArmadura.setUmbralMayorBase(newArmadura.getUmbralMayorBase());
                            existingArmadura.setUmbralGraveBase(newArmadura.getUmbralGraveBase());
                            existingArmadura.setRasgoEspecial(newArmadura.getRasgoEspecial());
                            itemRepository.save(existingArmadura);
                        } else if (existing instanceof Consumible existingConsumible && item instanceof Consumible newConsumible) {
                            existingConsumible.setTier(newConsumible.getTier());
                            existingConsumible.setEsHomebrew(newConsumible.isEsHomebrew());
                            existingConsumible.setDescripcion(newConsumible.getDescripcion());
                            itemRepository.save(existingConsumible);
                        } else {
                            item.setId(existing.getId());
                            itemRepository.save(item);
                        }
                        actualizados++;
                    } else {
                        item.setId(null);
                        itemRepository.save(item);
                        insertados++;
                    }
                }
                logger.debug("[JsonFolderSeeder] Leído archivo de ítems '{}' -> {} ítem(s).", path.getFileName(), itemsFromFile.size());
            } catch (Exception e) {
                logger.error("[JsonFolderSeeder] Error al procesar archivo de ítems '{}': {}", path.getFileName(), e.getMessage());
            }
        }

        logger.info("[JSON Ingestion] Proceso completado: {} leídos, {} insertados, {} actualizados/omitidos.", totalLeidos, insertados, actualizados);
    }

    @Transactional
    public void seedCharactersFromFolder(File personajesDir) {
        List<Path> jsonFiles = findJsonFilesRecursively(personajesDir);
        if (jsonFiles.isEmpty()) {
            logger.info("[JsonFolderSeeder] No se encontraron archivos JSON en carpeta 'personajes' ('{}').", personajesDir.getAbsolutePath());
            return;
        }

        int totalLeidos = 0;
        int insertados = 0;
        int actualizados = 0;

        for (Path path : jsonFiles) {
            boolean isHomebrew = isHomebrewPath(path);
            try {
                JsonNode root = objectMapper.readTree(path.toFile());
                List<PlayerCharacter> charactersFromFile = new ArrayList<>();
                if (root.isArray()) {
                    charactersFromFile = objectMapper.convertValue(root, new TypeReference<List<PlayerCharacter>>() {});
                } else if (root.has("characters") && root.get("characters").isArray()) {
                    charactersFromFile = objectMapper.convertValue(root.get("characters"), new TypeReference<List<PlayerCharacter>>() {});
                } else {
                    PlayerCharacter single = objectMapper.treeToValue(root, PlayerCharacter.class);
                    if (single != null) charactersFromFile.add(single);
                }

                totalLeidos += charactersFromFile.size();

                for (PlayerCharacter pc : charactersFromFile) {
                    if (pc.getNombre() == null || pc.getNombre().isBlank()) {
                        continue;
                    }
                    if (isHomebrew) {
                        pc.setEsHomebrew(true);
                    }

                    Optional<PlayerCharacter> existingOpt = characterRepository.findByNombre(pc.getNombre());
                    if (existingOpt.isPresent()) {
                        PlayerCharacter existing = existingOpt.get();
                        pc.setId(existing.getId());
                        characterRepository.save(pc);
                        actualizados++;
                    } else {
                        pc.setId(null);
                        characterRepository.save(pc);
                        insertados++;
                    }
                }
                logger.debug("[JsonFolderSeeder] Leído archivo de personajes '{}' -> {} personaje(s).", path.getFileName(), charactersFromFile.size());
            } catch (Exception e) {
                logger.error("[JsonFolderSeeder] Error al procesar archivo de personaje '{}': {}", path.getFileName(), e.getMessage());
            }
        }

        logger.info("[JSON Ingestion] Proceso completado: {} leídos, {} insertados, {} actualizados/omitidos.", totalLeidos, insertados, actualizados);
    }

    @Transactional
    public void seedAdversariesFromFolder(File adversariosDir) {
        List<Path> jsonFiles = findJsonFilesRecursively(adversariosDir);
        if (jsonFiles.isEmpty()) {
            logger.info("[JsonFolderSeeder] No se encontraron archivos JSON en carpeta 'adversarios' ('{}').", adversariosDir.getAbsolutePath());
            return;
        }

        int totalLeidos = 0;
        int insertados = 0;
        int actualizados = 0;

        for (Path path : jsonFiles) {
            try {
                JsonNode root = objectMapper.readTree(path.toFile());
                List<com.daggerheart.vtt.model.AdversaryTemplate> adversariesFromFile = new ArrayList<>();
                if (root.isArray()) {
                    adversariesFromFile = objectMapper.convertValue(root, new TypeReference<List<com.daggerheart.vtt.model.AdversaryTemplate>>() {});
                } else if (root.has("adversaries") && root.get("adversaries").isArray()) {
                    adversariesFromFile = objectMapper.convertValue(root.get("adversaries"), new TypeReference<List<com.daggerheart.vtt.model.AdversaryTemplate>>() {});
                } else if (root.has("monstruos") && root.get("monstruos").isArray()) {
                    adversariesFromFile = objectMapper.convertValue(root.get("monstruos"), new TypeReference<List<com.daggerheart.vtt.model.AdversaryTemplate>>() {});
                } else {
                    com.daggerheart.vtt.model.AdversaryTemplate single = objectMapper.treeToValue(root, com.daggerheart.vtt.model.AdversaryTemplate.class);
                    if (single != null) adversariesFromFile.add(single);
                }

                totalLeidos += adversariesFromFile.size();

                for (com.daggerheart.vtt.model.AdversaryTemplate adv : adversariesFromFile) {
                    if (adv.getNombre() == null || adv.getNombre().isBlank()) {
                        continue;
                    }

                    Optional<com.daggerheart.vtt.model.AdversaryTemplate> existingOpt = adversaryTemplateRepository.findByNombre(adv.getNombre());
                    if (existingOpt.isPresent()) {
                        com.daggerheart.vtt.model.AdversaryTemplate existing = existingOpt.get();
                        adv.setId(existing.getId());
                        adversaryTemplateRepository.save(adv);
                        actualizados++;
                    } else {
                        adv.setId(null);
                        adversaryTemplateRepository.save(adv);
                        insertados++;
                    }
                }
                logger.debug("[JsonFolderSeeder] Leído archivo de adversarios '{}' -> {} adversario(s).", path.getFileName(), adversariesFromFile.size());
            } catch (Exception e) {
                logger.error("[JsonFolderSeeder] Error al procesar archivo de adversarios '{}': {}", path.getFileName(), e.getMessage());
            }
        }

        logger.info("[JSON Ingestion] Proceso de adversarios completado: {} leídos, {} insertados, {} actualizados/omitidos.", totalLeidos, insertados, actualizados);
    }
}
