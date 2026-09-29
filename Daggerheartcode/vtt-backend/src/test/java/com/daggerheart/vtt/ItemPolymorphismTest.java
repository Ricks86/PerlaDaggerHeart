package com.daggerheart.vtt;

import com.daggerheart.vtt.model.Arma;
import com.daggerheart.vtt.model.Armadura;
import com.daggerheart.vtt.model.Consumible;
import com.daggerheart.vtt.model.Item;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class ItemPolymorphismTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void testDeductionPolymorphism() throws Exception {
        String json = """
            [
              {
                "nombre": "Espada Larga",
                "tier": 1,
                "categoria": "Principal",
                "rasgo": "Filosa",
                "dadoBase": "d8",
                "modificadorDano": 1,
                "tipoDano": "físico",
                "carga": 1,
                "alcance": "Cuerpo a cuerpo"
              },
              {
                "nombre": "Cota de Escamas",
                "tier": 1,
                "puntuacionBase": 5,
                "umbralMayorBase": 8,
                "umbralGraveBase": 15,
                "rasgoEspecial": "Pesada"
              },
              {
                "nombre": "Poción de Vida",
                "tier": 1,
                "descripcion": "Cura 3 HP"
              }
            ]
            """;

        List<Item> items = objectMapper.readValue(json, new TypeReference<List<Item>>() {});

        assertEquals(3, items.size());
        assertInstanceOf(Arma.class, items.get(0));
        assertEquals("Espada Larga", items.get(0).getNombre());
        assertEquals("d8", ((Arma) items.get(0)).getDadoBase());

        assertInstanceOf(Armadura.class, items.get(1));
        assertEquals("Cota de Escamas", items.get(1).getNombre());
        assertEquals(5, ((Armadura) items.get(1)).getPuntuacionBase());

        assertInstanceOf(Consumible.class, items.get(2));
        assertEquals("Poción de Vida", items.get(2).getNombre());
        assertEquals("Cura 3 HP", ((Consumible) items.get(2)).getDescripcion());
    }

    @Test
    public void testDeductionWithExtraTipoField() throws Exception {
        String json = """
            [
              {
                "tipo": "Arma",
                "nombre": "Daga",
                "tier": 1,
                "dadoBase": "d4",
                "modificadorDano": 0,
                "categoria": "Secundaria",
                "alcance": "Cuerpo a cuerpo"
              }
            ]
            """;

        List<Item> items = objectMapper.readValue(json, new TypeReference<List<Item>>() {});
        assertEquals(1, items.size());
        assertInstanceOf(Arma.class, items.get(0));
    }
}
