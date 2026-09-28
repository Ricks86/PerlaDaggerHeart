package com.daggerheart.vtt.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configura el broker de mensajes STOMP sobre WebSocket.
 *
 * Flujo de mensajes:
 *  Cliente → /app/action → TableController → /topic/table → Todos los clientes
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Registra el endpoint WebSocket al que los clientes se conectan.
     * SockJS provee fallback para navegadores sin soporte nativo de WS.
     * CORS permisivo (*) para desarrollo local con React en puerto 3000.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-daggerheart")
                .setAllowedOriginPatterns("*")  // Permisivo para desarrollo
                .withSockJS();
    }

    /**
     * Configura el message broker:
     *  - /topic: broker simple para broadcast a todos los suscriptores
     *  - /app:   prefijo para mensajes que van a @MessageMapping (controladores)
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }
}
