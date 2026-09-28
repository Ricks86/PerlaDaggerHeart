package com.daggerheart.vtt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada principal del backend Daggerheart VTT.
 * Levanta el servidor Spring Boot en puerto 8080 por defecto.
 */
@SpringBootApplication
public class VttBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(VttBackendApplication.class, args);
    }
}
