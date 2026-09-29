package com.daggerheart.vtt.seeder;

import com.daggerheart.vtt.model.Card;
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

import java.io.File;
import java.util.ArrayList;
import java.util.List;

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
    private final ObjectMapper objectMapper;
    private final String jsonFolderPath;

    public JsonFolderSeeder(
            CardRepository cardRepository,
            ItemRepository itemRepository,
            PlayerCharacterRepository characterRepository,
            ObjectMapper objectMapper,
            @Value("${daggerheart.data.folder:../Jsons}") String jsonFolderPath) {
        this.cardRepository = cardRepository;
        this.itemRepository = itemRepository;
        this.characterRepository = characterRepository;
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

        logger.info("[JsonFolderSeeder] ✓ Proceso de semillero externo finalizado.");
    }

    private void seedCardsFromFolder(File cartasDir) {
        if (!cartasDir.exists() || !cartasDir.isDirectory()) {
            logger.info("[JsonFolderSeeder] Carpeta 'cartas' no encontrada en '{}'. Omitiendo.", cartasDir.getAbsolutePath());
            return;
        }

        if (cardRepository.count() > 0) {
            logger.info("[JsonFolderSeeder] La base de datos ya contiene cartas (count={}). Omitiendo siembra de cartas.", cardRepository.count());
            return;
        }

        File[] jsonFiles = cartasDir.listFiles((dir, name) -> name.toLowerCase().endsWith(".json"));
        if (jsonFiles == null || jsonFiles.length == 0) {
            logger.info("[JsonFolderSeeder] Carpeta cartas vacía, omitiendo siembra.");
            return;
        }

        List<Card> allCards = new ArrayList<>();
        for (File file : jsonFiles) {
            try {
                JsonNode root = objectMapper.readTree(file);
                List<Card> cardsFromFile = new ArrayList<>();
                if (root.isArray()) {
                    cardsFromFile = objectMapper.convertValue(root, new TypeReference<List<Card>>() {});
                } else if (root.has("cards") && root.get("cards").isArray()) {
                    cardsFromFile = objectMapper.convertValue(root.get("cards"), new TypeReference<List<Card>>() {});
                } else {
                    Card single = objectMapper.treeToValue(root, Card.class);
                    if (single != null) cardsFromFile.add(single);
                }
                allCards.addAll(cardsFromFile);
                logger.info("[JsonFolderSeeder] Leído archivo '{}' -> {} carta(s).", file.getName(), cardsFromFile.size());
            } catch (Exception e) {
                logger.error("[JsonFolderSeeder] Error al leer archivo de cartas '{}': {}", file.getName(), e.getMessage());
            }
        }

        if (!allCards.isEmpty()) {
            cardRepository.saveAll(allCards);
            logger.info("[JsonFolderSeeder] ✓ {} cartas sembradas exitosamente en la base de datos.", allCards.size());
        }
    }

    private void seedItemsFromFolder(File itemsDir) {
        if (!itemsDir.exists() || !itemsDir.isDirectory()) {
            logger.info("[JsonFolderSeeder] Carpeta items no encontrada en '{}', omitiendo siembra.", itemsDir.getAbsolutePath());
            return;
        }

        File[] jsonFiles = itemsDir.listFiles((dir, name) -> name.toLowerCase().endsWith(".json"));
        if (jsonFiles == null || jsonFiles.length == 0) {
            logger.info("[JsonFolderSeeder] Carpeta items vacía, omitiendo siembra.");
            return;
        }

        if (itemRepository.count() > 0) {
            logger.info("[JsonFolderSeeder] La base de datos ya contiene ítems (count={}). Omitiendo siembra de ítems.", itemRepository.count());
            return;
        }

        List<Item> allItems = new ArrayList<>();
        for (File file : jsonFiles) {
            try {
                JsonNode root = objectMapper.readTree(file);
                List<Item> itemsFromFile = new ArrayList<>();
                if (root.isArray()) {
                    itemsFromFile = objectMapper.convertValue(root, new TypeReference<List<Item>>() {});
                } else if (root.has("items") && root.get("items").isArray()) {
                    itemsFromFile = objectMapper.convertValue(root.get("items"), new TypeReference<List<Item>>() {});
                } else {
                    Item single = objectMapper.treeToValue(root, Item.class);
                    if (single != null) itemsFromFile.add(single);
                }
                allItems.addAll(itemsFromFile);
                logger.info("[JsonFolderSeeder] Leído archivo '{}' -> {} ítem(s).", file.getName(), itemsFromFile.size());
            } catch (Exception e) {
                logger.error("[JsonFolderSeeder] Error al leer archivo de ítems '{}': {}", file.getName(), e.getMessage());
            }
        }

        if (!allItems.isEmpty()) {
            itemRepository.saveAll(allItems);
            logger.info("[JsonFolderSeeder] ✓ {} ítems sembrados exitosamente en la base de datos.", allItems.size());
        }
    }

    private void seedCharactersFromFolder(File personajesDir) {
        if (!personajesDir.exists() || !personajesDir.isDirectory()) {
            logger.info("[JsonFolderSeeder] Carpeta personajes no encontrada en '{}', omitiendo siembra.", personajesDir.getAbsolutePath());
            return;
        }

        File[] jsonFiles = personajesDir.listFiles((dir, name) -> name.toLowerCase().endsWith(".json"));
        if (jsonFiles == null || jsonFiles.length == 0) {
            logger.info("[JsonFolderSeeder] Carpeta personajes vacía, omitiendo siembra.");
            return;
        }

        if (characterRepository.count() > 0) {
            logger.info("[JsonFolderSeeder] La base de datos ya contiene personajes (count={}). Omitiendo siembra de personajes.", characterRepository.count());
            return;
        }

        List<PlayerCharacter> allCharacters = new ArrayList<>();
        for (File file : jsonFiles) {
            try {
                JsonNode root = objectMapper.readTree(file);
                if (root.isArray()) {
                    List<PlayerCharacter> list = objectMapper.convertValue(root, new TypeReference<List<PlayerCharacter>>() {});
                    for (PlayerCharacter pc : list) {
                        pc.setId(null);
                        allCharacters.add(pc);
                    }
                } else {
                    PlayerCharacter single = objectMapper.treeToValue(root, PlayerCharacter.class);
                    if (single != null) {
                        single.setId(null);
                        allCharacters.add(single);
                    }
                }
                logger.info("[JsonFolderSeeder] Leído archivo de personaje '{}'.", file.getName());
            } catch (Exception e) {
                logger.error("[JsonFolderSeeder] Error al leer archivo de personaje '{}': {}", file.getName(), e.getMessage());
            }
        }

        if (!allCharacters.isEmpty()) {
            characterRepository.saveAll(allCharacters);
            logger.info("[JsonFolderSeeder] ✓ {} personajes sembrados exitosamente en la base de datos.", allCharacters.size());
        }
    }
}
