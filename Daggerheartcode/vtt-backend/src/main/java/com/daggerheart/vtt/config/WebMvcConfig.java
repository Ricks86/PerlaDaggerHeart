package com.daggerheart.vtt.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.TimeUnit;

/**
 * WebMvcConfig: Configuración de recursos estáticos del SPA y control de caché.
 *
 * Evita que el navegador cachee index.html con referencias a hashes obsoletos de JS,
 * eliminando errores de pantalla negra o 404 al recompilar el frontend.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // index.html y raíz: Sin caché para obligar al navegador a pedir siempre el bundle actual
        registry.addResourceHandler("/", "/index.html")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noStore().mustRevalidate());

        // Assets con hash de contenido: Caché inmutable
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic());
    }
}
