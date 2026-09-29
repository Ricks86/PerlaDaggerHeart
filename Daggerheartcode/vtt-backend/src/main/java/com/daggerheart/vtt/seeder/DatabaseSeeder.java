package com.daggerheart.vtt.seeder;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * DatabaseSeeder: se ejecuta al iniciar la aplicación.
 *
 * Configurado en modo producción limpia: no inserta ningún dato inicial.
 * La base de datos inicia con 0 cartas, 0 ítems, 0 personajes y 0 adversarios.
 * El catálogo, compendio y personajes serán poblados manualmente por el usuario.
 */
@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        System.out.println("[VTT Seeder] ✓ Base de datos inicializada en estado completamente limpio (0 cartas, 0 ítems, 0 personajes, 0 adversarios).");
    }
}

