package com.daggerheart.vtt.seeder;

import com.daggerheart.vtt.model.*;
import com.daggerheart.vtt.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * DatabaseSeeder: se ejecuta al iniciar la aplicación.
 *
 * Lee src/main/resources/db.json e inserta los datos en H2
 * SOLO si las tablas están vacías (idempotente: no duplica en reinicios).
 *
 * Orden de siembra:
 *  1. Cartas
 *  2. Ítems polimórficos (Arma, Armadura, Consumible)
 *  3. Personajes (con armas y armaduras equipadas)
 *  4. Adversarios
 */
@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final PlayerCharacterRepository characterRepo;
    private final CardRepository cardRepo;
    private final ItemRepository itemRepo;
    private final AdversaryRepository adversaryRepo;
    private final ObjectMapper objectMapper;

    public DatabaseSeeder(
            PlayerCharacterRepository characterRepo,
            CardRepository cardRepo,
            ItemRepository itemRepo,
            AdversaryRepository adversaryRepo,
            ObjectMapper objectMapper) {
        this.characterRepo = characterRepo;
        this.cardRepo = cardRepo;
        this.itemRepo = itemRepo;
        this.adversaryRepo = adversaryRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        ClassPathResource resource = new ClassPathResource("db.json");
        try (InputStream is = resource.getInputStream()) {
            JsonNode root = objectMapper.readTree(is);
            seedCards(root.get("cards"));
            seedItems(root.get("items"));
            seedCharacters(root.get("characters"));
            seedAdversaries(root.get("adversaries"));
        }
        System.out.println("[VTT Seeder] ✓ Base de datos inicializada correctamente");
    }

    // -------------------------------------------------------------------------
    // Seed: Cartas
    // -------------------------------------------------------------------------
    private void seedCards(JsonNode nodes) {
        if (cardRepo.count() > 0 || nodes == null) return;

        List<Card> cards = new ArrayList<>();
        for (JsonNode node : nodes) {
            String metadata = node.has("metadata") && !node.get("metadata").isNull()
                ? (node.get("metadata").isTextual() ? node.get("metadata").asText() : node.get("metadata").toString())
                : null;

            Card card = new Card(
                node.get("titulo").asText(),
                node.get("tipo").asText(),
                node.get("nivel").asInt(),
                node.get("descripcion").asText(),
                metadata
            );
            cards.add(card);
        }
        cardRepo.saveAll(cards);
        System.out.printf("[VTT Seeder] ✓ %d carta(s) insertada(s)%n", cards.size());
    }

    // -------------------------------------------------------------------------
    // Seed: Ítems (Polimórficos: Arma, Armadura, Consumible)
    // -------------------------------------------------------------------------
    private void seedItems(JsonNode nodes) {
        if (itemRepo.count() > 0 || nodes == null) return;

        List<Item> items = new ArrayList<>();
        for (JsonNode node : nodes) {
            String tipo = node.path("tipo").asText();
            String nombre = node.path("nombre").asText();
            int tier = node.path("tier").asInt(1);

            if ("Arma".equalsIgnoreCase(tipo)) {
                Arma arma = new Arma(
                    nombre,
                    tier,
                    node.path("categoria").asText("Principal"),
                    node.path("rasgo").asText(""),
                    node.path("dadoBase").asText("d8"),
                    node.path("modificadorDano").asInt(0),
                    node.path("tipoDano").asText("físico"),
                    node.path("carga").asInt(1),
                    node.path("alcance").asText("Cuerpo a cuerpo")
                );
                items.add(arma);
            } else if ("Armadura".equalsIgnoreCase(tipo)) {
                Armadura armadura = new Armadura(
                    nombre,
                    tier,
                    node.path("puntuacionBase").asInt(4),
                    node.path("umbralMayorBase").asInt(7),
                    node.path("umbralGraveBase").asInt(14),
                    node.path("rasgoEspecial").isMissingNode() || node.path("rasgoEspecial").isNull() ? null : node.path("rasgoEspecial").asText()
                );
                items.add(armadura);
            } else if ("Consumible".equalsIgnoreCase(tipo)) {
                Consumible consumible = new Consumible(
                    nombre,
                    tier,
                    node.path("descripcion").asText("")
                );
                items.add(consumible);
            }
        }
        itemRepo.saveAll(items);
        System.out.printf("[VTT Seeder] ✓ %d ítem(s) insertado(s)%n", items.size());
    }

    // -------------------------------------------------------------------------
    // Seed: Personajes
    // -------------------------------------------------------------------------
    private void seedCharacters(JsonNode nodes) {
        if (characterRepo.count() > 0 || nodes == null) return;

        List<Item> allItems = itemRepo.findAll();
        Map<String, Item> itemMap = allItems.stream()
            .collect(Collectors.toMap(Item::getNombre, i -> i, (a, b) -> a));

        List<PlayerCharacter> characters = new ArrayList<>();
        for (JsonNode node : nodes) {
            PlayerCharacter pc = new PlayerCharacter();
            pc.setNombre(node.get("nombre").asText());
            pc.setNivel(node.get("nivel").asInt());
            pc.setClase(node.get("clase").asText());
            pc.setSubclase(node.get("subclase").asText());
            pc.setAncestro(node.get("ancestro").asText());
            pc.setComunidad(node.get("comunidad").asText());
            pc.setCompetencia(node.get("competencia").asInt());
            pc.setHpActual(node.get("hpActual").asInt());
            pc.setHpMax(node.get("hpMax").asInt());
            pc.setEstresActual(node.get("estresActual").asInt());
            pc.setEstresMax(node.get("estresMax").asInt());
            pc.setEsperanzaActual(node.get("esperanzaActual").asInt());
            pc.setEsperanzaMax(node.get("esperanzaMax").asInt());
            pc.setEvasion(node.get("evasion").asInt());

            // Atributos embebidos
            JsonNode attrNode = node.get("atributos");
            if (attrNode != null) {
                Atributos atributos = new Atributos(
                    attrNode.get("agilidad").asInt(),
                    attrNode.get("fuerza").asInt(),
                    attrNode.get("sutileza").asInt(),
                    attrNode.get("instinto").asInt(),
                    attrNode.get("presencia").asInt(),
                    attrNode.get("conocimiento").asInt()
                );
                pc.setAtributos(atributos);
            }

            // Oro embebido
            JsonNode oroNode = node.get("oro");
            if (oroNode != null) {
                Oro oro = new Oro(
                    oroNode.get("punados").asInt(),
                    oroNode.get("sacos").asInt(),
                    oroNode.get("cofres").asInt()
                );
                pc.setOro(oro);
            }

            // Experiencias (colección embebida)
            if (node.has("experiencias")) {
                List<Experiencia> experiencias = new ArrayList<>();
                for (JsonNode expNode : node.get("experiencias")) {
                    experiencias.add(new Experiencia(
                        expNode.get("nombre").asText(),
                        expNode.get("valor").asInt()
                    ));
                }
                pc.setExperiencias(experiencias);
            }

            // Equipamiento e Inventario (Sprint 11)
            if (node.has("armaPrincipal")) {
                Item item = itemMap.get(node.get("armaPrincipal").asText());
                if (item instanceof Arma arma) pc.setArmaPrincipal(arma);
            }
            if (node.has("armaSecundaria")) {
                Item item = itemMap.get(node.get("armaSecundaria").asText());
                if (item instanceof Arma arma) pc.setArmaSecundaria(arma);
            }
            if (node.has("armaduraActiva")) {
                Item item = itemMap.get(node.get("armaduraActiva").asText());
                if (item instanceof Armadura armadura) pc.setArmaduraActiva(armadura);
            }
            if (node.has("inventario")) {
                for (JsonNode invNode : node.get("inventario")) {
                    Item item = itemMap.get(invNode.asText());
                    if (item != null) {
                        pc.getInventario().add(item);
                    }
                }
            }

            characters.add(pc);
        }
        characterRepo.saveAll(characters);
        System.out.printf("[VTT Seeder] ✓ %d personaje(s) insertado(s)%n", characters.size());
    }

    // -------------------------------------------------------------------------
    // Seed: Adversarios
    // -------------------------------------------------------------------------
    private void seedAdversaries(JsonNode nodes) {
        if (adversaryRepo.count() > 0 || nodes == null) return;

        List<Adversary> adversaries = new ArrayList<>();
        for (JsonNode node : nodes) {
            Adversary adv = new Adversary();
            adv.setNombre(node.get("nombre").asText());
            adv.setRango(node.get("rango").asText());
            adv.setDificultad(node.get("dificultad").asText());
            adv.setUmbralMayor(node.get("umbralMayor").asInt());
            adv.setUmbralGrave(node.get("umbralGrave").asInt());
            adv.setHp(node.get("hp").asInt());
            adv.setEstres(node.get("estres").asInt());
            adv.setModificadorAtaque(node.get("modificadorAtaque").asInt());
            adv.setDanoEstandar(node.get("danoEstandar").asText());
            adversaries.add(adv);
        }
        adversaryRepo.saveAll(adversaries);
        System.out.printf("[VTT Seeder] ✓ %d adversario(s) insertado(s)%n", adversaries.size());
    }
}
