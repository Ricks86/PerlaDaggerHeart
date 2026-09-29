package com.daggerheart.vtt.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * SpaRedirectController: Redirige las rutas del frontend (SPA) a index.html.
 *
 * Permite que rutas como /dm, /creator, /dashboard, etc. sean resueltas
 * por el frontend de React sin generar errores 404 en Spring Boot,
 * excluyendo explícitamente llamadas a la API (/api/**), WebSockets
 * (/ws-daggerheart/**), consola H2 (/h2-console/**) y recursos con extensión (.js, .css, etc.).
 */
@Controller
public class SpaRedirectController {

    @RequestMapping(value = {
        "/{path:^(?!api|ws-daggerheart|h2-console)[^\\.]*}",
        "/{path1:^(?!api|ws-daggerheart|h2-console)[^\\.]*}/{path2:[^\\.]*}",
        "/{path1:^(?!api|ws-daggerheart|h2-console)[^\\.]*}/{path2:[^\\.]*}/{path3:[^\\.]*}"
    })
    public String forward(jakarta.servlet.http.HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setDateHeader("Expires", 0);
        return "forward:/index.html";
    }
}
