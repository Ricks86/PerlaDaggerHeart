# Daggerheart VTT — Versión 1.0

Plataforma Virtual Tabletop (VTT) diseñada específicamente para el sistema de rol **Daggerheart** (Darrington Press). Cuenta con sincronización bidireccional en tiempo real vía WebSocket, persistencia de base de datos relacional (PostgreSQL / H2) y una interfaz React optimizada con estética de fantasía oscura y pergamino antiguo.

> 🗺️ **Mapa Maestro del Código**: Consulta el archivo [**`CODEBASE_MAP.md`**](./CODEBASE_MAP.md) para un inventario completo de archivos, guías de búsqueda rápida («si quieres cambiar X, ve a Y»), flujo de canales WebSocket y reglas de negocio implementadas.

---

## 🚀 Cómo Levantar la Aplicación

### Opción 1: Ejecutar el JAR autónomo unificado (Recomendado)
El archivo JAR autoejecutable ya incluye el frontend compilado con Vite y empaquetado en el servidor Spring Boot:

```bash
cd vtt-backend
java -jar target/vtt-backend-0.0.1-SNAPSHOT.jar
```
- La aplicación completa estará disponible de inmediato en **`http://localhost:8080`**.

---

### Opción 2: Modo Desarrollo (Hot-Reload)

#### 1. Backend (Spring Boot en Puerto 8080)
```bash
cd vtt-backend
mvn spring-boot:run
```

#### 2. Frontend (Vite en Puerto 3000 con proxy a 8080)
```bash
cd vtt-frontend
npm install
npm run dev
```

---

## ⚔️ Características Principales (v1.0)

1. **Motor Duality Roll**: Tiradas con dados de Esperanza y Miedo (2d12 + mod) con cálculo automático de éxitos con esperanza o fallos/éxitos con miedo.
2. **Reserva de Miedo Global (Fear Pool)**: Conexión reactiva en tiempo real; las tiradas con Miedo incrementan automáticamente la reserva del DJ, con soporte para gasto regular, modo silencioso y purga.
3. **Relojes de Cuenta Atrás (Countdowns)**: Temporizadores narrativos de peligro sincronizados en tiempo real y persistidos en la base de datos.
4. **Deck de Pergamino Antiguo & Bóveda**: Panel de cartas con estética medieval, límite estricto de 5 cartas de dominio en Loadout, y exención de ranuras para cartas Homebrew.
5. **Forja de Héroes Guiada (Nivel 1)**: Asistente modular de 5 pasos para crear personajes respetando matriz estándar, dominios de clase y auto-equipado inteligente con regla de armas a 2 manos.
6. **Panel Asimétrico del DJ & Bestiario**: Grid táctico de hasta 15 adversarios simultáneos, catálogo de criaturas con invocación de 1 a 5 copias y creación de monstruos.
7. **Compendio de Reglas & Forja de Ítems**: Catálogos oficiales de cartas, armas, armaduras y consumibles con caché centralizada en memoria (0 ms de latencia).
