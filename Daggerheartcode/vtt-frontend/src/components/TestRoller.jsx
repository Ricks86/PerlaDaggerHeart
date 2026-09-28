import React, { useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

/**
 * Componente de prueba para verificar la sincronización WebSocket.
 * Permite simular un lanzamiento de D20 desde cualquier cliente
 * y ver el resultado reflejado en tiempo real en el SharedRollLog.
 *
 * En sprints futuros esto evolucionará al motor Duality Roll (2d12 + mod)
 * y al Custom Roll con apilamiento visual de dados.
 */
export default function TestRoller() {
  const [playerName, setPlayerName] = useState('');
  const { sendTableAction, connected } = useWebSocket();

  function rollD20() {
    const name = playerName.trim();
    if (!name) {
      alert('Ingresa un nombre de jugador antes de tirar');
      return;
    }
    if (!connected) {
      alert('No hay conexión con el servidor. Espera un momento...');
      return;
    }

    // Generar número aleatorio 1-20 (inclusive en ambos extremos)
    const result = Math.floor(Math.random() * 20) + 1;

    sendTableAction('ROLL', name, { result, dice: 'd20' });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') rollD20();
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎲 Panel de Prueba</h2>

      <div style={styles.inputGroup}>
        <label style={styles.label} htmlFor="playerNameInput">
          Nombre del Jugador
        </label>
        <input
          id="playerNameInput"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ej: Arya, DJ..."
          style={styles.input}
          maxLength={30}
        />
      </div>

      <button
        onClick={rollD20}
        disabled={!connected}
        style={connected ? styles.button : styles.buttonDisabled}
        title={!connected ? 'Sin conexión al servidor' : 'Tirar D20'}
      >
        Tirar D20 de Prueba
      </button>

      {!connected && (
        <p style={styles.warningMsg}>
          ⚠️ Conectando con el servidor...
        </p>
      )}

      <p style={styles.hint}>
        Tip: Abre múltiples pestañas del navegador con este mismo URL
        para simular varios jugadores conectados al mismo tiempo.
      </p>
    </div>
  );
}

// =============================================================================
// Estilos
// =============================================================================
const styles = {
  container: {
    border: '1px solid #4a3728',
    borderRadius: '8px',
    backgroundColor: '#1a1208',
    padding: '20px',
    minWidth: '300px',
    maxWidth: '400px',
  },
  title: {
    color: '#d4af37',
    margin: '0 0 16px 0',
    fontSize: '1.1rem',
    borderBottom: '1px solid #4a3728',
    paddingBottom: '8px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '14px',
  },
  label: {
    color: '#a0906a',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  input: {
    padding: '8px 12px',
    backgroundColor: '#241a0e',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    color: '#e8dcc8',
    fontSize: '0.95rem',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#8b1a1a',
    color: '#e8dcc8',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#3a2a1a',
    color: '#7a6a5a',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    fontSize: '1rem',
    cursor: 'not-allowed',
  },
  warningMsg: {
    color: '#f4c430',
    fontSize: '0.8rem',
    marginTop: '8px',
    textAlign: 'center',
  },
  hint: {
    color: '#7a6a5a',
    fontSize: '0.75rem',
    marginTop: '14px',
    fontStyle: 'italic',
    lineHeight: '1.4',
  },
};
