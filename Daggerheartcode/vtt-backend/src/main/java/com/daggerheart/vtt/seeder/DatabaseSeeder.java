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

/**
 * DatabaseSeeder: se ejecuta al iniciar la aplicación.
 *
 * Lee src/main/resources/db.json e inserta los datos en H2
 * SOLO si las tablas están vacías (idempotente: no duplica en reinicios).
 *
 * Flujo:
 *  1. Leer db.json desde el classpath
 *  2. Parsear con Jackson ObjectMapper
 *  3. Comprobar si la tabla correspondiente está vacía
 *  4. Si vacía → deserializar y persistir cada entidad
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
        // Cargar el JSON desde el classpath
        ClassPathResource resource = new ClassPathResource("db.json");
        try (InputStream is = resource.getInputStream()) {
            JsonNode root = objectMapper.readTree(is);
            seedCharacters(root.get("characters"));
            seedCards(root.get("cards"));
            seedItems(root.get("items"));
            seedAdversaries(root.get("adversaries"));
        }
        System.out.println("[VTT Seeder] ✓ Base de datos inicializada correctamente");
    }

    // -------------------------------------------------------------------------
    // Seed: Personajes
    // -------------------------------------------------------------------------
    private void seedCharacters(JsonNode nodes) {
        if (characterRepo.count() > 0 || nodes == null) return;

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
            Atributos atributos = new Atributos(
                attrNode.get("agilidad").asInt(),
                attrNode.get("fuerza").asInt(),
                attrNode.get("sutileza").asInt(),
                attrNode.get("instinto").asInt(),
                attrNode.get("presencia").asInt(),
                attrNode.get("conocimiento").asInt()
            );
            pc.setAtributos(atributos);

            // Oro embebido
            JsonNode oroNode = node.get("oro");
            Oro oro = new Oro(
                oroNode.get("punados").asInt(),
                oroNode.get("sacos").asInt(),
                oroNode.get("cofres").asInt()
            );
            pc.setOro(oro);

            // Experiencias (colección embebida)
            List<Experiencia> experiencias = new ArrayList<>();
            for (JsonNode expNode : node.get("experiencias")) {
                experiencias.add(new Experiencia(
                    expNode.get("nombre").asText(),
                    expNode.get("valor").asInt()
                ));
            }
            pc.setExperiencias(experiencias);

            characters.add(pc);
        }
        characterRepo.saveAll(characters);
        System.out.printf("[VTT Seeder] ✓ %d personaje(s) insertado(s)%n", characters.size());
    }

    // -------------------------------------------------------------------------
    // Seed: Cartas
    // -------------------------------------------------------------------------
    private void seedCards(JsonNode nodes) {
        if (cardRepo.count() > 0 || nodes == null) return;

        List<Card> cards = new ArrayList<>();
        for (JsonNode node : nodes) {
            Card card = new Card(
                node.get("titulo").asText(),
                node.get("tipo").asText(),
                node.get("nivel").asInt(),
                node.get("descripcion").asText()
            );
            cards.add(card);
        }
        cardRepo.saveAll(cards);
        System.out.printf("[VTT Seeder] ✓ %d carta(s) insertada(s)%n", cards.size());
    }

    // -------------------------------------------------------------------------
    // Seed: Ítems
    // -------------------------------------------------------------------------
    private void seedItems(JsonNode nodes) {
        if (itemRepo.count() > 0 || nodes == null) return;

        List<Item> items = new ArrayList<>();
        for (JsonNode node : nodes) {
            Item item = new Item();
            item.setNombre(node.get("nombre").asText());
            item.setTipo(node.get("tipo").asText());
            item.setRasgo(node.get("rasgo").asText());
            item.setDadoBase(node.path("dadoBase").isNull() ? null : node.path("dadoBase").asText());
            item.setModificadorDano(node.get("modificadorDano").asInt());
            item.setTipoDano(node.path("tipoDano").isNull() ? null : node.path("tipoDano").asText());
            item.setCarga(node.get("carga").asInt());
            item.setAlcance(node.path("alcance").isNull() ? null : node.path("alcance").asText());
            item.setRasgoEspecial(node.path("rasgoEspecial").asText(null));
            items.add(item);
        }
        itemRepo.saveAll(items);
        System.out.printf("[VTT Seeder] ✓ %d ítem(s) insertado(s)%n", items.size());
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
