package com.daggerheart.vtt;

import com.daggerheart.vtt.model.Card;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class JsonFolderSeederTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void testReadRealCartasFiles() throws Exception {
        File folder = new File("/home/duckyrichii/Escritorio/codigos/base de datos/Daggerheartcode/Jsons/cartas");
        assertTrue(folder.exists() && folder.isDirectory(), "La carpeta Jsons/cartas debe existir");

        File[] jsonFiles = folder.listFiles((dir, name) -> name.endsWith(".json"));
        assertNotNull(jsonFiles);
        assertTrue(jsonFiles.length >= 4);

        int totalCards = 0;
        for (File file : jsonFiles) {
            List<Card> cards = objectMapper.readValue(file, new TypeReference<List<Card>>() {});
            assertFalse(cards.isEmpty(), "El archivo " + file.getName() + " no debe estar vacío");
            for (Card c : cards) {
                assertNotNull(c.getTitulo(), "El título no debe ser nulo");
                assertNotNull(c.getTipo(), "El tipo no debe ser nulo");
            }
            totalCards += cards.size();
        }

        assertTrue(totalCards > 20, "Debe haber más de 20 cartas cargadas");
    }
}
