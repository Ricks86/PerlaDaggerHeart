import React, { useState, useEffect } from 'react';
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
function TrackerRow({ label, max = 0, colorKey, size = 24 }) {
  const [slots, setSlots] = useState(() => Array(max).fill(false));
  const color = TRACKER_COLORS[colorKey];

  useEffect(() => {
    setSlots((prev) => {
      if (prev.length === max) return prev;
      return Array(max).fill(false).map((v, i) => prev[i] || false);
    });
  }, [max]);

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
      {max > 0 ? (
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
      ) : (
        <span style={styles.emptySlotsNotice}>— Sin ranuras disponibles —</span>
      )}
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

  const armaduraActiva = character.armaduraActiva;
  const nivel = character.nivel || 1;

  // Sprint 11 - Fase 4: Ranuras dinámicas de armadura y cálculo de umbrales
  const armorSlotsMax = armaduraActiva ? (armaduraActiva.puntuacionBase || 0) : 0;
  const umbralMayor = armaduraActiva ? (armaduraActiva.umbralMayorBase + nivel) : null;
  const umbralGrave = armaduraActiva ? (armaduraActiva.umbralGraveBase + nivel) : null;

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

        {/* Umbrales de Daño calculados dinámicamente con armadura + nivel */}
        <div style={styles.thresholdsCard}>
          <div style={styles.thresholdsHeader}>
            <span style={styles.thresholdTitle}>Umbrales de Daño:</span>
            <span style={styles.thresholdFormula}>(Base + Nv.{nivel})</span>
          </div>
          <div style={styles.thresholdBadges}>
            <div style={styles.thresholdItemMajor}>
              <span style={styles.thresholdSublabel}>Mayor</span>
              <strong style={styles.thresholdNum}>{umbralMayor != null ? umbralMayor : '—'}</strong>
            </div>
            <div style={styles.thresholdItemSevere}>
              <span style={styles.thresholdSublabel}>Grave</span>
              <strong style={styles.thresholdNum}>{umbralGrave != null ? umbralGrave : '—'}</strong>
            </div>
          </div>
        </div>

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

        {/* Ranuras de Armadura dinámicas */}
        <div style={styles.armorTrackingGroup}>
          <TrackerRow
            label={armaduraActiva ? `Ranuras de Armadura (${armaduraActiva.nombre})` : 'Ranuras de Armadura (Sin armadura)'}
            max={armorSlotsMax}
            colorKey="armadura"
          />

          {/* Nota de texto estática si la armadura tiene rasgo especial */}
          {armaduraActiva?.rasgoEspecial && (
            <div style={styles.armorTraitNote}>
              <span style={styles.armorTraitIcon}>⚠️</span>
              <span style={styles.armorTraitText}>
                <strong>Efecto de Armadura:</strong> {armaduraActiva.rasgoEspecial}
              </span>
            </div>
          )}
        </div>
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
  emptySlotsNotice: {
    color: '#6a5a4a',
    fontSize: '0.75rem',
    fontStyle: 'italic',
  },
  thresholdsCard: {
    backgroundColor: '#120b06',
    border: '1px solid #3a2a1a',
    borderRadius: '6px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '-4px',
  },
  thresholdsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thresholdTitle: {
    color: '#a0906a',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  thresholdFormula: {
    color: '#7a6a5a',
    fontSize: '0.7rem',
  },
  thresholdBadges: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  thresholdItemMajor: {
    backgroundColor: '#26140b',
    border: '1px solid #7d441f',
    borderRadius: '4px',
    padding: '4px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thresholdItemSevere: {
    backgroundColor: '#300f0f',
    border: '1px solid #8b1a1a',
    borderRadius: '4px',
    padding: '4px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thresholdSublabel: {
    color: '#e8dcc8',
    fontSize: '0.72rem',
  },
  thresholdNum: {
    color: '#f5c86c',
    fontSize: '0.95rem',
  },
  armorTrackingGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  armorTraitNote: {
    backgroundColor: '#241a0e',
    border: '1px solid #6b4e1b',
    borderRadius: '5px',
    padding: '6px 10px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    fontSize: '0.75rem',
    color: '#ffd580',
    lineHeight: '1.3',
  },
  armorTraitIcon: {
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  armorTraitText: {
    color: '#f5e4c3',
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
