# Daggerheart VTT — Sprint 1: Infraestructura Base

## Estructura del Proyecto

```
Daggerheartcode/
├── vtt-backend/                   # Spring Boot (Puerto 8080)
│   ├── pom.xml
│   └── src/main/java/com/daggerheart/vtt/
│       ├── VttBackendApplication.java
│       ├── config/
│       │   └── WebSocketConfig.java    # STOMP + SockJS
│       ├── controller/
│       │   └── TableController.java    # Relay WebSocket
│       └── dto/
│           └── TableAction.java        # DTO genérico
│
└── vtt-frontend/                  # React JSX (Puerto 3000)
    └── src/
        ├── App.jsx                     # Raíz con Provider
        ├── context/
        │   └── WebSocketContext.jsx    # Estado global WS
        └── components/
            ├── SharedRollLog.jsx       # Historial de mesa
            └── TestRoller.jsx          # Panel de prueba
```

## Levantar el Proyecto

### 1. Backend
```bash
cd vtt-backend
./mvnw spring-boot:run
# → Servidor en http://localhost:8080
# → H2 Console en http://localhost:8080/h2-console
```

### 2. Frontend
```bash
cd vtt-frontend
npm install
npm start
# → App en http://localhost:3000
```

## Flujo de Mensajes WebSocket

```
[Cliente] → SEND /app/action → [TableController] → BROADCAST /topic/table → [Todos los Clientes]
```

## Cómo Probar la Sincronización

1. Abre **2 o más pestañas** en `http://localhost:3000`
2. En cada pestaña escribe un nombre de jugador diferente
3. Haz clic en **"Tirar D20 de Prueba"** desde cualquier pestaña
4. Observa el resultado aparecer en **todas las pestañas simultáneamente**

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Java 21 + Spring Boot 3.3.4 |
| WebSocket | Spring WebSocket + STOMP |
| Base de Datos | H2 (embebida, en memoria) |
| Frontend | React 18 (JSX puro) |
| WS Client | SockJS + @stomp/stompjs |
| Estado Global | Context API + useReducer |

## Próximos Sprints

- **Sprint 2**: Entidades de datos (Character, Card, Item, Adversary) + persistencia H2
- **Sprint 3**: Motor Duality Roll (2d12 + mod) + Custom Roll (dados apilables)
- **Sprint 4**: Fichas de personaje con rastreadores visuales (HP, Estrés, Esperanza)
- **Sprint 5**: Herramientas asimétricas del DJ + creador de NPCs
