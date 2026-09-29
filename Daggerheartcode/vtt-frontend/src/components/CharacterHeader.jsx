import React from 'react';
import { useCharacter } from '../context/CharacterContext';
import { useDice } from '../context/DiceContext';
import EquipmentManager from './EquipmentManager';

/**
 * Cabecera visual del personaje activo (Sprint 11.5).
 * Dividida en dos bloques:
 * - Bloque Izquierdo: Nombre, nivel, clase/ancestro, stats clave y atributos clickeables.
 * - Bloque Derecho: Gestor de equipamiento compacto (Armas, Armadura e Inventario Rápido).
 */
export default function CharacterHeader() {
  const { character, loading, error } = useCharacter();
  const { requestDualityWithMod } = useDice();

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
      {/* =================================================================== */}
      {/* BLOQUE IZQUIERDO: Identidad, Stats principales y Atributos           */}
      {/* =================================================================== */}
      <div style={styles.leftBlock}>
        {/* Nombre + Badge de nivel */}
        <div style={styles.nameRow}>
          <h2 style={styles.name}>{character.nombre}</h2>
          <span style={styles.levelBadge}>Nv. {character.nivel}</span>
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
      {/* BLOQUE DERECHO: Equipamiento Activo e Inventario Rápido (Sprint 11.5)*/}
      {/* =================================================================== */}
      <div style={styles.rightBlock}>
        <EquipmentManager />
      </div>
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
    flex: '1 1 380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minWidth: '300px',
  },
  rightBlock: {
    flex: '1.2 1 480px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    borderLeft: '1px solid #2e1f13',
    paddingLeft: '16px',
    minWidth: '320px',
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
