# 🗺️ Mapa de Arquitectura y Referencia Rápida del Código
**Daggerheart VTT — Versión 1.0 (Producción)**

Este documento sirve como **mapa maestro del código** para desarrolladores e inteligencias artificiales. Describe la estructura completa de backend y frontend, las responsabilidades de cada archivo, qué datos maneja, a qué otros componentes afecta y una guía de búsqueda rápida para realizar modificaciones instantáneas sin tener que analizar el código fuente desde cero.

---

## 📑 Tabla de Contenidos
1. [Visión General de la Arquitectura](#1-visión-general-de-la-arquitectura)
2. [Guía Rápida: «Si quieres cambiar X, ve a Y»](#2-guía-rápida-si-quieres-cambiar-x-ve-a-y)
3. [Backend: Estructura, Servicios y Controladores](#3-backend-estructura-servicios-y-controladores)
4. [Frontend: Contextos Globales (Single Source of Truth)](#4-frontend-contextos-globales-single-source-of-truth)
5. [Frontend: Componentes y Módulos de Interfaz](#5-frontend-componentes-y-módulos-de-interfaz)
6. [Canales WebSocket y Protocolo de Comunicación](#6-canales-websocket-y-protocolo-de-comunicación)
7. [Reglas Clave de Negocio (Daggerheart System)](#7-reglas-clave-de-negocio-daggerheart-system)

---

## 1. Visión General de la Arquitectura

```
Daggerheartcode/
├── CODEBASE_MAP.md                 <- (ESTE ARCHIVO) Mapa maestro del código
├── README.md                       <- Instrucciones generales de arranque
├── Jsons/                          <- Compendios JSON oficiales (Cards, Items, Adversaries)
│
├── vtt-backend/                    <- Spring Boot 3.3.4 (Java 21)
│   ├── src/main/java/com/daggerheart/vtt/
│   │   ├── config/                 <- WebSocket STOMP y Spring WebMVC
│   │   ├── controller/             <- Endpoints REST y endpoints WebSocket (/app/action)
│   │   ├── dto/                    <- Objetos de transferencia de datos
│   │   ├── model/                  <- Entidades JPA (PostgreSQL / H2)
│   │   ├── repository/             <- Repositorios Spring Data JPA
│   │   ├── seeder/                 <- Carga de datos iniciales desde Jsons/
│   │   └── service/                <- Lógica de negocio (Personajes, Combate, Mesa, Nivel)
│   └── target/
│       └── vtt-backend-0.0.1-SNAPSHOT.jar  <- JAR ejecutable autónomo (incluye frontend)
│
└── vtt-frontend/                   <- React 18 + Vite (Code-Splitting + Context API)
    ├── src/
    │   ├── context/                <- Proveedores globales (WS, Compendium, Character, DM)
    │   ├── components/             <- Componentes de interfaz de usuario
    │   │   ├── characterCreator/   <- Wizard modular de creación de personaje (Pasos 1 a 5)
    │   │   └── encounter/          <- Grid táctico, Bestiario y Formulario de monstruos
    │   ├── App.jsx                 <- Shell principal con navegación por pestañas
    │   └── main.jsx                <- Punto de entrada React
    └── dist/                       <- Archivos compilados por Vite (empaquetados en el .jar)
```

---

## 2. Guía Rápida: «Si quieres cambiar X, ve a Y»

| Si necesitas modificar... | Archivos de Frontend | Archivos de Backend |
|---|---|---|
| **Reserva de Miedo (Fear Pool)** | [`GlobalFearAndCountdownsBar.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/GlobalFearAndCountdownsBar.jsx), [`SharedRollLog.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/SharedRollLog.jsx) | [`TableStateService.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/service/TableStateService.java), [`TableStateController.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/controller/TableStateController.java) |
| **Relojes de Cuenta Atrás (Countdowns)** | [`GlobalFearAndCountdownsBar.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/GlobalFearAndCountdownsBar.jsx) | [`Countdown.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/model/Countdown.java), [`TableStateService.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/service/TableStateService.java) |
| **Tiradas Duality (Esperanza vs Miedo)** | [`DiceRoller.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/DiceRoller.jsx), [`SharedRollLog.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/SharedRollLog.jsx) | [`TableController.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/controller/TableController.java) (`handleAction`) |
| **Cartas de Dominio / Loadout (máx 5)** | [`DomainCardsPanel.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/DomainCardsPanel.jsx), [`DomainCardItem.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/DomainCardItem.jsx), [`CardSwapModal.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/CardSwapModal.jsx) | [`CharacterService.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/service/CharacterService.java) (`swapDomainCard`, `isDomainCard`) |
| **Cartas Homebrew (Exentas de slots)** | [`DomainCardsPanel.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/DomainCardsPanel.jsx), [`DomainSelector.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/DomainSelector.jsx) | [`CharacterService.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/service/CharacterService.java) (`isDomainCard`) |
| **Creación de Personajes (Wizard)** | [`CharacterCreator.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/CharacterCreator.jsx) y carpeta `characterCreator/` | [`GameController.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/controller/GameController.java) (`POST /api/characters`) |
| **Subida de Nivel (Level Up)** | [`LevelUpModal.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/LevelUpModal.jsx) | [`LevelUpService.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/service/LevelUpService.java), [`GameController.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/controller/GameController.java) |
| **Encuentros, Combate y Monstruos** | [`EncounterManager.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/EncounterManager.jsx) y carpeta `encounter/` | [`EncounterService.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/service/EncounterService.java), [`EncounterController.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/controller/EncounterController.java) |
| **Inventario, Armas y Armaduras** | [`EquipmentManager.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/EquipmentManager.jsx), [`ItemForge.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/ItemForge.jsx), [`GiftItemModal.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/GiftItemModal.jsx) | [`ItemController.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/controller/ItemController.java), [`Item.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/model/Item.java) |
| **Caché y Catálogos de Cartas/Ítems** | [`CompendiumContext.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/context/CompendiumContext.jsx) | [`GameController.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/controller/GameController.java) (`/api/cards`), [`ItemController.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/controller/ItemController.java) (`/api/items`) |
| **WebSocket y Canales STOMP** | [`WebSocketContext.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/context/WebSocketContext.jsx) | [`WebSocketConfig.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/config/WebSocketConfig.java), [`TableController.java`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-backend/src/main/java/com/daggerheart/vtt/controller/TableController.java) |

---

## 3. Backend: Estructura, Servicios y Controladores

### 3.1 Modelos Principales (`model/`)
- **`PlayerCharacter.java`**: Entidad principal del jugador.
  - Atributos: `nombre`, `nivel`, `clase`, `subclase`, `ancestro`, `comunidad`, `hpActual`, `hpMax`, `estresActual`, `estresMax`, `esperanzaActual`, `esperanzaMax`, `evasion`, `ranurasArmaduraMarcadas`.
  - JSON Lists: `cartasActivasIds`, `loadout` (Cartas de Dominio activas, máx 5), `boveda` (Cartas de Dominio en reserva), `inventario` (Mochila).
  - Equipamiento: `armaPrincipal`, `armaSecundaria`, `armaduraActiva`.
  - Objetos embebidos: `Atributos` (AGI, FUE, SUT, INS, PRE, CON), `Oro` (puñados, sacos, cofres), `Experiencias` (lista con valor +2 a +4).
- **`Card.java`**: Representa una carta (Dominio, Clase, Subclase, Linaje, Comunidad, Homebrew).
  - Campos: `titulo`, `tipo`, `dominio`, `nivel`, `costeRecuperacion`, `descripcion`, `esHomebrew`, `metadata` (JSON para clase_padre, evasion_base, hp_inicial).
- **`Item.java` / `Arma.java` / `Armadura.java` / `Consumible.java`**: Jerarquía polimórfica de ítems con `discriminatorColumn = "tipo"`.
  - `Arma`: `dadoBase`, `modificadorDano`, `tipoDano`, `alcance`, `carga` (1 o 2 manos), `categoria` (Principal/Secundaria), `rasgo`, `rasgoEspecial`.
  - `Armadura`: `puntuacionBase` (ranuras), `umbralMayorBase`, `umbralGraveBase`, `rasgoEspecial`.
- **`TableState.java` & `Countdown.java`**: Estado global de la sesión única (`id = 1L`).
  - `fearPool`: Entero (mínimo 0).
  - `countdowns`: Lista `@OneToMany` de relojes (`id`, `nombre`, `valorActual`, `valorMaximo`, `visibleParaJugadores`).
- **`ActiveAdversary.java` & `AdversaryTemplate.java`**: Monstruos en combate táctico (hasta 15 activos) y catálogo de moldes/bestiario.

### 3.2 Servicios (`service/`)
- **`CharacterService.java`**:
  - `swapDomainCard(charId, req)`: Intercambia cartas entre Loadout y Bóveda. Aplica validación estricta de 5 slots y exime a cartas Homebrew.
  - `isDomainCard(Card c)`: Discrimina si una carta consume slot de dominio o si es Homebrew / de trasfondo.
  - `ensureLoadoutInitialized(pc)`: Asegura que el loadout contenga solo cartas de dominio válidas y no supere 5 ranuras.
  - `updateCharacter(...)`: Actualizaciones reactivas que se transmiten a `/topic/characters`.
- **`TableStateService.java`**:
  - `incrementFearOnDualityRoll()`: Suma +1 de miedo al ganar el Miedo en tiradas Duality y notifica a `/topic/table-state`.
  - `spendOrAdjustFear(delta, value, motivo, silent)`: Gasta o purga puntos. Si `silent == false`, emite `FEAR_SPENT` a `/topic/table`. Si `silent == true`, reduce sin alertar en el chat.
  - `createCountdown()`, `updateCountdown()`, `announceCountdown()`, `deleteCountdown()`: Gestión de relojes con emisión automática de `COUNTDOWN_TRIGGERED` al llegar a 0.
- **`EncounterService.java`**:
  - `spawnAdversaries(req)`: Añade copias de monstruos al encuentro táctico garantizando un máximo de 15 simultáneos.
  - `updateHp()`, `updateStress()`, `clearEncounter()`: Emite cambios a `/topic/encounter`.
- **`LevelUpService.java`**:
  - Valida y procesa subida de niveles del 2 al 10 respetando la matriz de opciones por Tier según reglas de Daggerheart.

### 3.3 Controladores (`controller/`)
- **`TableController.java`**: Endpoint `/app/action`. Recibe `ROLL`, `CHAT`, etc. En tiradas Duality, compara `fearRoll > hopeRoll` e invoca `incrementFearOnDualityRoll()`. Emite a `/topic/table`.
- **`TableStateController.java`**: Endpoints `/api/table-state/**` (`GET`, `PATCH /fear`, `POST /countdowns`, `PATCH /countdowns/{id}`, etc.).
- **`GameController.java`**: `/api/characters/**`, `/api/cards/**`, subida de nivel, swap de cartas.
- **`ItemController.java`**: `/api/items/**` (creación, edición, borrado de armas, armaduras y consumibles).
- **`EncounterController.java`**: `/api/encounter/**` (gestión de adversarios y plantillas).

---

## 4. Frontend: Contextos Globales (Single Source of Truth)

Los contextos React proveen estado reactivo y eliminan la necesidad de pasar props innecesariamente:

1. **[`WebSocketContext.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/context/WebSocketContext.jsx)**:
   - Administra la conexión WebSocket con SockJS y STOMP.
   - Suscrito a `/topic/table` (mensajes y tiradas del chat), `/topic/characters` (actualizaciones de hojas) y `/topic/table-state` (miedo y relojes).
   - Expone: `connected`, `sendAction(action)`, `rollLog`, `tableState`.
2. **[`CompendiumContext.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/context/CompendiumContext.jsx)**:
   - **Caché centralizada en memoria** de `/api/cards` e `/api/items`.
   - Se carga una sola vez al montar la app.
   - Expone: `useCards()`, `useItems()`, `useCompendium()`, y los métodos `refreshCards()` y `refreshItems()` para invalidación bajo demanda.
3. **[`CharacterContext.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/context/CharacterContext.jsx)**:
   - Administra el héroe activo del jugador (`character`, `updateHp`, `updateStress`, `updateHope`, `swapCards`, `equipItem`).
4. **[`DmContext.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/context/DmContext.jsx)**:
   - Administra los adversarios activos en escena (`activeEncounter`), el monstruo enfocado (`selectedAdversary`) y las plantillas del bestiario (`templates`).

---

## 5. Frontend: Componentes y Módulos de Interfaz

### 5.1 Barra Global Superior
- **[`GlobalFearAndCountdownsBar.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/GlobalFearAndCountdownsBar.jsx)**:
  - Visible tanto para Jugadores como para el DJ.
  - Lado Izquierdo: Reserva de Miedo con chips rápidos de gasto, botón silencioso `[-1 🤫]` y vaciado completo a 0.
  - Lado Derecho: Relojes de peligro (píldoras de segmentos horizontales, alternancia de visibilidad `👁️`, anuncios en el chat y alerta al llegar a 0).

### 5.2 Cartas y Mazo de Dominio
- **[`DomainCardsPanel.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/DomainCardsPanel.jsx)**: Orquestador del panel de cartas.
- **[`ParchmentNavDeck.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/ParchmentNavDeck.jsx)**: Botonera con estética de pergamino antiguo de 4 pestañas:
  1. `⚔️ Mano Activa`: Loadout (máximo 5 cartas de dominio).
  2. `📜 Clase & Linajes`: Las 4 cartas base de trasfondo (Clase, Subclase, Linaje, Comunidad).
  3. `🔮 Cartas Homebrew`: Modificadores y cartas caseras acordadas con el DJ (sin límite de capacidad).
  4. `📦 Bóveda de Dominio`: Cartas de dominio inactivas en reserva.
- **[`DomainCardItem.jsx`](file:///home/duckyrichii/Escritorio/codigos/base%20de%20datos/Daggerheartcode/vtt-frontend/src/components/DomainCardItem.jsx)**: Componente atómico reutilizable que dibuja cualquier carta con sus badges, costos de recuperación y botones de acción (Subir/Bajar a Bóveda, Recuperar Estrés).

### 5.3 Asistente de Creación de Héroes (`src/components/characterCreator/`)
- **`CharacterCreator.jsx`** (502 líneas): Orquestador del wizard y envío de personaje.
- **`characterCreatorConstants.jsx`**: Matriz estándar, lista de atributos y funciones de compatibilidad de dominios.
- **`characterCreatorStyles.js`**: Estilos temáticos desacoplados.
- **`Step1Origins.jsx`**: Nombre, Clase, Subclase vinculada, Linaje y Comunidad.
- **`Step2Attributes.jsx`**: Asignación de la matriz `(+2, +1, +1, +0, +0, -1)`.
- **`Step3Experiences.jsx`**: Experiencias iniciales (+2 fijo).
- **`Step4DomainCards.jsx`**: Selección de 2 cartas de dominio Nivel 1.
- **`Step5Equipment.jsx`**: Selección de 1 armadura, 2 armas (con regla de 2 manos) y mochila de consumibles.

### 5.4 Encuentros y Combate (`src/components/encounter/`)
- **`EncounterManager.jsx`** (279 líneas): Orquestador de combate del DJ.
- **`encounterStyles.js`**: Estilos Dark Fantasy desacoplados.
- **`InteractiveTracker.jsx`**: Casillas circulares interactivas para marcar/desmarcar HP y Estrés.
- **`AdversaryCard.jsx`**: Monstruo activo en el grid táctico con foco, estado derrotado y controles.
- **`TacticalGrid.jsx`**: Cuadrícula de 15 slots con cabecera de encuentro.
- **`TemplateCard.jsx`**: Molde del compendio con selector de invocación rápida (x1 a x5).
- **`BestiaryCompendium.jsx`**: Buscador y filtros de plantillas por Tier y Rango.
- **`CreateMonsterForm.jsx`**: Formulario para crear monstruos con 3 modos de guardado e invocación.

---

## 6. Canales WebSocket y Protocolo de Comunicación

| Canal / Tópico | Dirección | Payload / Evento | Propósito |
|---|:---:|---|---|
| `/app/action` | Cliente ➔ Backend | `TableAction` (`ROLL`, `CHAT`, `CLEAR`) | Envío de tiradas y mensajes. El backend intercepta Duality y suma miedo si aplica. |
| `/topic/table` | Backend ➔ Clientes | `TableAction` (`ROLL`, `FEAR_SPENT`, `COUNTDOWN_TRIGGERED`) | Historial compartido de tiradas y anuncios globales de mesa. |
| `/topic/table-state` | Backend ➔ Clientes | `TableState` (`fearPool`, `countdowns`) | Sincronización en tiempo real de la reserva de miedo y relojes activos. |
| `/topic/characters` | Backend ➔ Clientes | `PlayerCharacter` | Actualizaciones en vivo de los datos de cualquier personaje. |
| `/topic/encounter` | Backend ➔ Clientes | Lista de `ActiveAdversary` | Actualizaciones instantáneas del grid táctico del combate. |

---

## 7. Reglas Clave de Negocio (Daggerheart System)

1. **Duality Roll**:
   - Se lanzan 2d12 (Dado de Esperanza y Dado de Miedo) + Modificador.
   - Si `Esperanza > Miedo`: Éxito con Esperanza (el héroe gana +1 Esperanza).
   - Si `Miedo >= Esperanza`: Éxito o Fallo con Miedo (el DJ gana +1 de Miedo en su reserva global).
2. **Capacidad de Dominio (Loadout)**:
   - Todo personaje puede tener como máximo **5 cartas de dominio en su Mano Activa (Loadout)**.
   - Las cartas en exceso residen en la **Bóveda**. Solo pueden intercambiarse durante descansos o momentos seguros.
3. **Exención de Cartas Homebrew**:
   - Las cartas marcadas como `Homebrew` representan modificaciones narrativas acordadas entre el jugador y el DJ. **Escapan a la regla de los 5 slots** y no ocupan espacio en el Loadout ni van a la Bóveda.
4. **Regla de Carga de Armas**:
   - Un arma de `carga = 2` (a 2 Manos) inhabilita la mano secundaria. Cualquier arma adicional pasa automáticamente a la mochila en el inventario.
5. **Relojes de Cuenta Atrás**:
   - Un reloj que desciende a 0 (`valorActual == 0`) dispara un evento narrativo crítico y se anuncia automáticamente a todos los jugadores si es visible.
