import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import SockJSImport from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// Interop CJS→ESM: Vite puede exponer el módulo en .default o directamente
const SockJS = SockJSImport.default ?? SockJSImport;

// =============================================================================
// Context
// =============================================================================

const WebSocketContext = createContext(null);

/**
 * Hook de acceso al contexto WebSocket.
 * Lanza error descriptivo si se usa fuera del Provider.
 */
export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error('useWebSocket debe usarse dentro de <WebSocketProvider>');
  }
  return ctx;
}

// =============================================================================
// Provider
// =============================================================================

/**
 * Gestiona la conexión STOMP/SockJS con el backend y expone:
 *   - tableLog:       Array con todas las acciones recibidas desde la mesa
 *   - sendTableAction: Función para enviar una acción al backend
 *   - connected:      Estado de la conexión WebSocket
 */
export function WebSocketProvider({ children }) {
  const [tableLog, setTableLog] = useState([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    // -------------------------------------------------------------------------
    // Inicializar cliente STOMP con SockJS como transporte
    // -------------------------------------------------------------------------
    const stompClient = new Client({
      // SockJS provee fallback para navegadores sin WS nativo
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-daggerheart'),

      // Reconexión automática cada 5 segundos si se cae la conexión
      reconnectDelay: 5000,

      onConnect: () => {
        console.log('[VTT] WebSocket conectado ✓');
        setConnected(true);

        // Suscripción al canal compartido de la mesa
        stompClient.subscribe('/topic/table', (message) => {
          try {
            const action = JSON.parse(message.body);
            // Agregar timestamp local para el historial visual
            const actionWithTimestamp = {
              ...action,
              _id: Date.now() + Math.random(), // key única para React
              _timestamp: new Date().toLocaleTimeString('es-ES'),
            };
            setTableLog((prev) => [...prev, actionWithTimestamp]);
          } catch (err) {
            console.error('[VTT] Error al parsear mensaje:', err);
          }
        });
      },

      onDisconnect: () => {
        console.log('[VTT] WebSocket desconectado');
        setConnected(false);
      },

      onStompError: (frame) => {
        console.error('[VTT] Error STOMP:', frame);
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    // Cleanup: desconectar al desmontar el provider
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, []); // Solo se ejecuta al montar

  // ---------------------------------------------------------------------------
  // Función pública para enviar acciones a la mesa
  // ---------------------------------------------------------------------------

  /**
   * Envía una acción a todos los clientes a través del backend.
   *
   * @param {string} actionType  - Tipo de acción: 'ROLL', 'CARD_PLAY', etc.
   * @param {string} playerName  - Nombre del jugador/DJ que origina la acción
   * @param {Object} payload     - Datos específicos de la acción
   */
  function sendTableAction(actionType, playerName, payload) {
    if (!clientRef.current || !clientRef.current.connected) {
      console.warn('[VTT] No hay conexión activa. Acción descartada:', actionType);
      return;
    }

    const action = {
      type: actionType,
      player: playerName,
      payload: payload,
    };

    clientRef.current.publish({
      destination: '/app/action',
      body: JSON.stringify(action),
    });
  }

  // ---------------------------------------------------------------------------
  // Valor expuesto al árbol de componentes
  // ---------------------------------------------------------------------------
  const contextValue = {
    tableLog,
    sendTableAction,
    connected,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
