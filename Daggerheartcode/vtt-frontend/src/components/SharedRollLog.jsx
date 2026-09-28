import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import MarkdownText from './MarkdownText';

// =============================================================================
// Mapa de iconos por tipo de acción
// =============================================================================
const ACTION_ICONS = {
  ROLL:        '🎲',
  DUALITY_ROLL:'⚔️',
  CARD_PLAYED: '🃏',
  HP_UPDATE:   '❤️',
  STRESS_UPDATE:'😰',
  HOPE_UPDATE: '✨',
  DEFAULT:     '📋',
};

// Colores de borde por tipo de carta (sincronizado con CardVault)
const CARD_TYPE_COLORS = {
  Clase:     '#8b2626',
  Subclase:  '#7a3e1d',
  Linaje:    '#2b528f',
  Ancestro:  '#1a4a8b',
  Comunidad: '#2b7546',
  Dominio:   '#61337d',
  Homebrew:  '#635e23',
  default:   '#4a3728',
};


// =============================================================================
// Subcomponente: entrada de tipo ROLL (texto simple)
// =============================================================================
function RollEntry({ action }) {
  const payload = action.payload ?? {};
  const dice    = payload.dice ?? 'd?';
  const result  = payload.result ?? '?';

  return (
    <li style={styles.rollItem}>
      <span style={styles.timestamp}>{action._timestamp}</span>
      <span style={styles.icon}>{ACTION_ICONS.ROLL}</span>
      <span style={styles.player}>{action.player}</span>
      <span style={styles.actionType}>tiró {dice}</span>
      <span style={styles.rollResult}>→ {result}</span>
    </li>
  );
}

// =============================================================================
// Subcomponente: entrada de tipo CARD_PLAYED (tarjeta visual)
// =============================================================================
function CardPlayedEntry({ action }) {
  const card = action.payload ?? {};
  const borderColor = CARD_TYPE_COLORS[card.tipo] ?? CARD_TYPE_COLORS.default;

  return (
    <li style={{ ...styles.cardItem, borderLeftColor: borderColor }}>
      {/* Cabecera */}
      <div style={styles.cardEntryHeader}>
        <span style={styles.timestamp}>{action._timestamp}</span>
        <span style={styles.icon}>{ACTION_ICONS.CARD_PLAYED}</span>
        <span style={styles.player}>{action.player}</span>
        <span style={styles.actionType}>ha usado la carta</span>
        <span style={styles.cardTitleInline}>{card.titulo}</span>
        {card.tipo && (
          <span
            style={{
              ...styles.cardTypeBadge,
              borderColor: borderColor,
              color: borderColor,
            }}
          >
            {card.tipo}
          </span>
        )}
      </div>

      {/* Cuerpo con descripción Markdown */}
      {card.descripcion && (
        <div style={styles.cardEntryBody}>
          <MarkdownText text={card.descripcion} />
        </div>
      )}
    </li>
  );
}

// =============================================================================
// Subcomponente: entrada de tipo DM_ROLL (Tirada exclusiva del Dungeon Master)
// =============================================================================
function DmRollEntry({ action }) {
  const payload = action.payload ?? {};
  const result = payload.result ?? '';
  const isCrit = payload.isCritical || payload.isCrit;

  return (
    <li
      style={{
        ...styles.dmRollItem,
        borderLeftColor: isCrit ? '#f4c430' : '#8b1a1a',
      }}
    >
      <div style={styles.dmHeader}>
        <span style={styles.timestamp}>{action._timestamp}</span>
        <span style={styles.icon}>👑</span>
        <span style={styles.dmPlayer}>{action.player}</span>
        {isCrit && <span style={styles.critBadge}>¡CRÍTICO!</span>}
      </div>
      <div style={styles.dmResult}>{result}</div>
    </li>
  );
}

// =============================================================================
// Subcomponente: entrada genérica (fallback)
// =============================================================================
function GenericEntry({ action }) {
  const icon = ACTION_ICONS[action.type] ?? ACTION_ICONS.DEFAULT;
  const payloadStr =
    typeof action.payload === 'object'
      ? Object.entries(action.payload ?? {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ')
      : String(action.payload ?? '');

  return (
    <li style={styles.rollItem}>
      <span style={styles.timestamp}>{action._timestamp}</span>
      <span style={styles.icon}>{icon}</span>
      <span style={styles.player}>{action.player}</span>
      <span style={styles.actionType}>[{action.type}]</span>
      <span style={styles.payloadText}>{payloadStr}</span>
    </li>
  );
}

// =============================================================================
// Componente principal: SharedRollLog
// =============================================================================

/**
 * Historial compartido en tiempo real de todas las acciones de la mesa.
 *
 * Renderizado condicional por tipo:
 *   ROLL        → RollEntry      (texto compacto: "Arya tiró d20 → 17")
 *   CARD_PLAYED → CardPlayedEntry (tarjeta visual con Markdown)
 *   otros       → GenericEntry   (fallback genérico)
 *
 * El log crece hacia abajo. Futuro: auto-scroll al último elemento.
 */
export default function SharedRollLog() {
  const { tableLog, connected } = useWebSocket();

  return (
    <div style={styles.container}>
      {/* Cabecera */}
      <div style={styles.header}>
        <h3 style={styles.title}>📜 Historial de Mesa</h3>
        <span style={connected ? styles.dotOn : styles.dotOff}>
          {connected ? '● Conectado' : '● Desconectado'}
        </span>
      </div>

      {/* Lista de eventos */}
      <div style={styles.logContainer}>
        {tableLog.length === 0 ? (
          <p style={styles.emptyMsg}>Aún no hay acciones en la mesa...</p>
        ) : (
          <ul style={styles.list}>
            {tableLog.map((action) => {
              switch (action.type) {
                case 'ROLL':
                  return <RollEntry key={action._id} action={action} />;
                case 'CARD_PLAYED':
                  return <CardPlayedEntry key={action._id} action={action} />;
                case 'DM_ROLL':
                  return <DmRollEntry key={action._id} action={action} />;
                default:
                  return <GenericEntry key={action._id} action={action} />;
              }
            })}
          </ul>
        )}
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
    display: 'flex',
    flexDirection: 'column',
    minHeight: '200px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    borderBottom: '1px solid #4a3728',
    paddingBottom: '8px',
  },
  title: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1rem',
  },
  dotOn: {
    color: '#4caf50',
    fontSize: '0.78rem',
    fontWeight: 'bold',
  },
  dotOff: {
    color: '#f44336',
    fontSize: '0.78rem',
    fontWeight: 'bold',
  },
  logContainer: {
    overflowY: 'auto',
    flex: 1,
  },
  emptyMsg: {
    color: '#7a6a5a',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px 0',
    fontSize: '0.88rem',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  // --- Entrada ROLL ---
  rollItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'baseline',
    padding: '6px 10px',
    backgroundColor: '#241a0e',
    borderRadius: '4px',
    borderLeft: '3px solid #4a3728',
    flexWrap: 'wrap',
  },
  rollResult: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: '1rem',
  },

  // --- Entrada CARD_PLAYED ---
  cardItem: {
    backgroundColor: '#1e1509',
    borderRadius: '6px',
    borderLeft: '4px solid #8b1a1a',
    overflow: 'hidden',
  },
  cardEntryHeader: {
    display: 'flex',
    gap: '7px',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    padding: '8px 12px 6px',
    backgroundColor: '#241a0e',
  },
  cardTitleInline: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  cardTypeBadge: {
    border: '1px solid',
    borderRadius: '3px',
    padding: '1px 6px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
  },
  cardEntryBody: {
    padding: '10px 14px',
    borderTop: '1px solid #2a1e12',
  },

  // --- Campos comunes ---
  timestamp: {
    color: '#7a6a5a',
    fontSize: '0.73rem',
    minWidth: '60px',
  },
  icon: {
    fontSize: '0.9rem',
  },
  player: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: '0.88rem',
  },
  actionType: {
    color: '#a0906a',
    fontSize: '0.8rem',
    fontStyle: 'italic',
  },
  payloadText: {
    color: '#e8dcc8',
    fontSize: '0.88rem',
  },

  // --- Entrada DM_ROLL ---
  dmRollItem: {
    backgroundColor: '#1b0e06',
    borderRadius: '6px',
    borderLeft: '4px solid #8b1a1a',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  dmHeader: {
    display: 'flex',
    gap: '7px',
    alignItems: 'center',
    padding: '6px 10px',
    backgroundColor: '#261408',
  },
  dmPlayer: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    letterSpacing: '0.5px',
  },
  critBadge: {
    backgroundColor: '#f4c430',
    color: '#0d0905',
    fontWeight: 'bold',
    fontSize: '0.68rem',
    padding: '1px 5px',
    borderRadius: '3px',
  },
  dmResult: {
    padding: '8px 12px',
    color: '#f5e6d3',
    fontSize: '0.88rem',
    fontWeight: '500',
  },
};
