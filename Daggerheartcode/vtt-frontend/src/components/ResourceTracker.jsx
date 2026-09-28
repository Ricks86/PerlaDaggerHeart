import React, { useState } from 'react';
import { useCharacter } from '../context/CharacterContext';

// =============================================================================
// Constantes de color por tipo de rastreador
// =============================================================================
const TRACKER_COLORS = {
  hp:       { filled: '#c0392b', border: '#8b1a1a', label: '#e8dcc8' },
  estres:   { filled: '#8b6914', border: '#6b5010', label: '#e8dcc8' },
  esperanza:{ filled: '#1a6b3a', border: '#0d4a27', label: '#e8dcc8' },
  armadura: { filled: '#2c5282', border: '#1a3a5c', label: '#e8dcc8' },
  punados:  { filled: '#7d5a2c', border: '#5c4020', label: '#c8a87a' },
  sacos:    { filled: '#9b7d3a', border: '#7a5f28', label: '#d4b87a' },
  cofres:   { filled: '#c8a040', border: '#a07828', label: '#e8d090' },
};

// =============================================================================
// Subcomponente: Casilla individual del rastreador
// =============================================================================
function TrackerSlot({ filled, onClick, color, size = 24 }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={filled ? 'Clic para vaciar' : 'Clic para marcar'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${color.border}`,
        backgroundColor: filled
          ? color.filled
          : hovered
          ? `${color.filled}33`
          : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        flexShrink: 0,
      }}
    />
  );
}

// =============================================================================
// Subcomponente: Fila de rastreador (label + casillas)
// =============================================================================
function TrackerRow({ label, max, colorKey, size = 24 }) {
  const [slots, setSlots] = useState(() => Array(max).fill(false));
  const color = TRACKER_COLORS[colorKey];
  const filled = slots.filter(Boolean).length;

  function toggle(index) {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  return (
    <div style={styles.rowContainer}>
      {/* Etiqueta + contador */}
      <div style={styles.rowHeader}>
        <span style={{ ...styles.rowLabel, color: color.label }}>{label}</span>
        <span style={styles.rowCounter}>{filled}/{max}</span>
      </div>

      {/* Casillas */}
      <div style={styles.slotsContainer}>
        {slots.map((isFilled, i) => (
          <TrackerSlot
            key={i}
            filled={isFilled}
            onClick={() => toggle(i)}
            color={color}
            size={size}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Subcomponente: Casilla de cofre (cuadrada, más grande)
// =============================================================================
function ChestSlot({ filled, onClick }) {
  const [hovered, setHovered] = useState(false);
  const color = TRACKER_COLORS.cofres;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={filled ? 'Cofre lleno — clic para vaciar' : 'Clic para marcar'}
      style={{
        width: 40,
        height: 40,
        borderRadius: '6px',
        border: `2px solid ${color.border}`,
        backgroundColor: filled
          ? color.filled
          : hovered
          ? `${color.filled}33`
          : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
      }}
    >
      {filled ? '📦' : ''}
    </div>
  );
}

// =============================================================================
// Componente principal: ResourceTracker
// =============================================================================

/**
 * Panel de recursos manuales del jugador.
 *
 * IMPORTANTE: No hay lógica automática. El jugador controla manualmente
 * cada casilla con un clic. El estado es 100% local (no sincronizado
 * con el backend en este sprint).
 *
 * Recursos rastreados:
 *   - Puntos de Golpe (hpMax del character)
 *   - Estrés         (estresMax)
 *   - Esperanza      (esperanzaMax)
 *   - Armadura       (estático: 5 ranuras si el backend no lo envía)
 *
 * Sistema de Oro:
 *   - 10 puñados → 10 sacos → 1 cofre
 */
export default function ResourceTracker() {
  const { character, loading } = useCharacter();
  const [cofre, setCofre] = useState(false);

  if (loading || !character) {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>⏳ Cargando recursos...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>⚡ Recursos</h3>

      {/* ------------------------------------------------------------------ */}
      {/* Rastreadores de combate                                              */}
      {/* ------------------------------------------------------------------ */}
      <div style={styles.section}>
        <TrackerRow
          label="Puntos de Golpe"
          max={character.hpMax}
          colorKey="hp"
        />
        <TrackerRow
          label="Estrés"
          max={character.estresMax}
          colorKey="estres"
        />
        <TrackerRow
          label="Esperanza"
          max={character.esperanzaMax}
          colorKey="esperanza"
        />
        <TrackerRow
          label="Ranuras de Armadura"
          max={character.armorSlots ?? 5}
          colorKey="armadura"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Sistema de Oro (jerarquía visual)                                   */}
      {/* ------------------------------------------------------------------ */}
      <div style={styles.divider} />
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>💰 Oro</h4>

        <TrackerRow
          label="Puñados"
          max={10}
          colorKey="punados"
          size={20}
        />
        <TrackerRow
          label="Sacos"
          max={10}
          colorKey="sacos"
          size={22}
        />

        {/* Cofre: casilla única cuadrada */}
        <div style={styles.rowContainer}>
          <div style={styles.rowHeader}>
            <span style={{ ...styles.rowLabel, color: TRACKER_COLORS.cofres.label }}>
              Cofre
            </span>
          </div>
          <div style={styles.slotsContainer}>
            <ChestSlot filled={cofre} onClick={() => setCofre((v) => !v)} />
          </div>
        </div>

        <p style={styles.goldHint}>
          10 puñados = 1 saco · 10 sacos = 1 cofre
        </p>
      </div>
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
    padding: '16px',
    minWidth: '280px',
    maxWidth: '380px',
  },
  title: {
    color: '#d4af37',
    margin: '0 0 14px 0',
    fontSize: '1rem',
    borderBottom: '1px solid #4a3728',
    paddingBottom: '8px',
  },
  sectionTitle: {
    color: '#c8a040',
    margin: '0 0 10px 0',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  divider: {
    borderTop: '1px solid #2a1e12',
    margin: '14px 0',
  },
  rowContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  rowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: '0.82rem',
    fontWeight: 'bold',
  },
  rowCounter: {
    fontSize: '0.75rem',
    color: '#7a6a5a',
  },
  slotsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
  },
  loadingText: {
    color: '#7a6a5a',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  goldHint: {
    color: '#4a3728',
    fontSize: '0.72rem',
    fontStyle: 'italic',
    marginTop: '4px',
  },
};
