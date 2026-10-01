import React, { useState } from 'react';
import { useCharacter } from '../context/CharacterContext';
import { useDice } from '../context/DiceContext';
import EquipmentManager from './EquipmentManager';
import LevelUpModal from './LevelUpModal';

/**
 * Cabecera visual del personaje activo (Sprint 11.5).
 * Dividida en dos bloques:
 * - Bloque Izquierdo: Nombre, nivel, clase/ancestro, stats clave y atributos clickeables.
 * - Bloque Derecho: Gestor de equipamiento compacto (Armas, Armadura e Inventario Rápido).
 */
export default function CharacterHeader() {
  const { character, loading, error } = useCharacter();
  const { requestDualityWithMod } = useDice();
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Estado: Cargando
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.skeletonRow}>
          <span style={styles.loadingText}>⏳ Cargando personaje...</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Estado: Error
  // -------------------------------------------------------------------------
  if (error) {
    return (
      <div style={{ ...styles.container, borderColor: '#8b1a1a' }}>
        <span style={styles.errorText}>
          ⚠️ Error: {error}. ¿Está el backend corriendo en el puerto 8080?
        </span>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Estado: Sin datos
  // -------------------------------------------------------------------------
  if (!character) return null;

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulseLevelUp {
          0% { transform: scale(1); box-shadow: 0 0 6px rgba(255, 215, 0, 0.4); }
          50% { transform: scale(1.04); box-shadow: 0 0 16px rgba(255, 215, 0, 0.85); }
          100% { transform: scale(1); box-shadow: 0 0 6px rgba(255, 215, 0, 0.4); }
        }
      `}</style>

      {/* =================================================================== */}
      {/* BLOQUE IZQUIERDO: Identidad, Stats principales y Atributos           */}
      {/* =================================================================== */}
      <div style={styles.leftBlock}>
        {/* Nombre + Badge de nivel + Botón de Subida */}
        <div style={styles.nameRow}>
          <h2 style={styles.name}>{character.nombre}</h2>
          <span style={styles.levelBadge}>Nv. {character.nivel}</span>
          {character.nivel < 10 && character.puedeSubirNivel && (
            <button
              onClick={() => setIsLevelUpOpen(true)}
              style={styles.btnLevelUpPulse}
              title={`¡El DJ ha desbloqueado tu Nivel ${character.nivel + 1}! Haz clic para subir de nivel`}
            >
              ⚡ ¡El DJ ha desbloqueado tu Nivel {character.nivel + 1}!
            </button>
          )}
        </div>

        {/* Identidad narrativa */}
        <div style={styles.identityRow}>
          <Chip label="Clase" value={character.clase} />
          <Chip label="Ancestro" value={character.ancestro} />
          <Chip label="Comunidad" value={character.comunidad} />
          {character.subclase && (
            <Chip label="Subclase" value={character.subclase} />
          )}
        </div>

        {/* Stats clave */}
        <div style={styles.statsRow}>
          <StatBox icon="⚔️" label="Competencia" value={`+${character.competencia}`} />
          <StatBox icon="❤️" label="HP" value={`${character.hpActual}/${character.hpMax}`} />
          <StatBox icon="😰" label="Estrés" value={`${character.estresActual}/${character.estresMax}`} />
          <StatBox icon="✨" label="Esperanza" value={`${character.esperanzaActual}/${character.esperanzaMax}`} />
          <StatBox icon="🛡️" label="Evasión" value={character.evasion} />
        </div>

        {/* Atributos clickeables → pre-cargan el modificador en el DiceRoller */}
        {character.atributos && (
          <div style={styles.attrSection}>
            <span style={styles.attrSectionLabel}>
              🎯 Clic en un atributo para usarlo como modificador:
            </span>
            <div style={styles.attrRow}>
              {[
                { label: 'AGI',  key: 'agilidad',    value: character.atributos.agilidad    },
                { label: 'FUE',  key: 'fuerza',       value: character.atributos.fuerza      },
                { label: 'SUT',  key: 'sutileza',     value: character.atributos.sutileza    },
                { label: 'INS',  key: 'instinto',     value: character.atributos.instinto    },
                { label: 'PRE',  key: 'presencia',    value: character.atributos.presencia   },
                { label: 'CON',  key: 'conocimiento', value: character.atributos.conocimiento},
              ].map(({ label, key, value }) => (
                <button
                  key={key}
                  onClick={() => requestDualityWithMod(value, label)}
                  style={styles.attrChip}
                  title={`Usar ${label} (${value >= 0 ? '+' : ''}${value}) como modificador del Duality Roll`}
                >
                  <span style={styles.attrChipLabel}>{label}</span>
                  <span style={styles.attrChipValue}>
                    {value >= 0 ? '+' : ''}{value}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* BLOQUE CENTRAL: Experiencias del Personaje (Sprint 22)              */}
      {/* =================================================================== */}
      <div style={styles.centerBlock}>
        <div style={styles.expCard}>
          <div style={styles.expHeader}>
            <span style={styles.expTitle}>🏷️ EXPERIENCIAS</span>
            <span style={styles.expSubtitle}>Clic para tirada de Dualidad</span>
          </div>

          <div style={styles.expList}>
            {character.experiencias && character.experiencias.length > 0 ? (
              character.experiencias.map((exp, idx) => (
                <button
                  key={idx}
                  onClick={() => requestDualityWithMod(exp.valor, exp.nombre)}
                  style={styles.expChip}
                  title={`Clic para usar "${exp.nombre}" (+${exp.valor}) en la tirada de Dualidad`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ffd700';
                    e.currentTarget.style.backgroundColor = '#382611';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#8b6d28';
                    e.currentTarget.style.backgroundColor = '#261b0c';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={styles.expChipName}>🏷️ {exp.nombre}</span>
                  <span style={styles.expChipBadge}>+{exp.valor}</span>
                </button>
              ))
            ) : (
              <span style={styles.noExpText}>Sin experiencias registradas</span>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* BLOQUE DERECHO: Equipamiento Activo e Inventario Rápido (Sprint 11.5)*/}
      {/* =================================================================== */}
      <div style={styles.rightBlock}>
        <EquipmentManager />
      </div>

      {/* Asistente interactivo de subida de nivel (Sprint 22) */}
      {isLevelUpOpen && (
        <LevelUpModal
          character={character}
          onClose={() => setIsLevelUpOpen(false)}
        />
      )}
    </div>
  );
}

// =============================================================================
// Sub-componentes internos
// =============================================================================

function Chip({ label, value }) {
  return (
    <div style={styles.chip}>
      <span style={styles.chipLabel}>{label}:</span>
      <span style={styles.chipValue}>{value}</span>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div style={styles.statBox}>
      <span style={styles.statIcon}>{icon}</span>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
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
    padding: '14px 18px',
    marginBottom: '0',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: '18px',
    flexWrap: 'wrap',
  },
  leftBlock: {
    flex: '1 1 360px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minWidth: '280px',
  },
  centerBlock: {
    flex: '0.9 1 240px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    borderLeft: '1px solid #2e1f13',
    paddingLeft: '16px',
    minWidth: '220px',
  },
  expCard: {
    backgroundColor: '#130d06',
    border: '1px solid #3d2c1c',
    borderRadius: '6px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minHeight: '120px',
    boxSizing: 'border-box',
  },
  expHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    borderBottom: '1px solid #2a1e12',
    paddingBottom: '4px',
  },
  expTitle: {
    color: '#d4af37',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  expSubtitle: {
    color: '#7a6a5a',
    fontSize: '0.66rem',
    fontStyle: 'italic',
  },
  expList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    overflowY: 'auto',
    maxHeight: '130px',
    paddingRight: '2px',
  },
  expChip: {
    backgroundColor: '#261b0c',
    border: '1px solid #8b6d28',
    borderRadius: '18px',
    padding: '4px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    cursor: 'pointer',
    color: '#f5e6c8',
    fontFamily: 'inherit',
    fontSize: '0.78rem',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
    textAlign: 'left',
  },
  expChipName: {
    fontWeight: '600',
    color: '#f5e6c8',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  expChipBadge: {
    backgroundColor: '#3a270a',
    color: '#ffd700',
    border: '1px solid #ffd700',
    borderRadius: '10px',
    padding: '1px 6px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  noExpText: {
    color: '#7a6a5a',
    fontSize: '0.74rem',
    fontStyle: 'italic',
    padding: '6px 0',
  },
  rightBlock: {
    flex: '1.2 1 440px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    borderLeft: '1px solid #2e1f13',
    paddingLeft: '16px',
    minWidth: '300px',
  },
  skeletonRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60px',
    width: '100%',
  },
  loadingText: {
    color: '#7a6a5a',
    fontStyle: 'italic',
    fontSize: '0.95rem',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: '0.9rem',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  name: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1.35rem',
    letterSpacing: '1px',
  },
  levelBadge: {
    backgroundColor: '#8b1a1a',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
  },
  btnLevelUpPulse: {
    backgroundColor: '#382509',
    color: '#ffea75',
    border: '1px solid #ffd700',
    borderRadius: '4px',
    padding: '3px 10px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    animation: 'pulseLevelUp 1.8s infinite',
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.45)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s ease',
  },
  identityRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#241a0e',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '0.78rem',
    display: 'flex',
    gap: '4px',
  },
  chipLabel: {
    color: '#7a6a5a',
  },
  chipValue: {
    color: '#e8dcc8',
    fontWeight: 'bold',
  },
  statsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  statBox: {
    backgroundColor: '#241a0e',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    padding: '6px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    minWidth: '60px',
  },
  statIcon: {
    fontSize: '0.9rem',
  },
  statValue: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: '0.95rem',
  },
  statLabel: {
    color: '#7a6a5a',
    fontSize: '0.68rem',
    textAlign: 'center',
  },

  // Atributos clickeables
  attrSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderTop: '1px solid #2a1e12',
    paddingTop: '8px',
  },
  attrSectionLabel: {
    color: '#7a6a5a',
    fontSize: '0.72rem',
    fontStyle: 'italic',
  },
  attrRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  attrChip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1px',
    padding: '4px 10px',
    backgroundColor: '#0d0905',
    border: '1px solid #4a3728',
    borderRadius: '5px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
    minWidth: '48px',
  },
  attrChipLabel: {
    color: '#7a6a5a',
    fontSize: '0.64rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  attrChipValue: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
};
