import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useCharacter } from '../context/CharacterContext';
import MarkdownText from './MarkdownText';
import DomainSelector from './DomainSelector';

// Mapa de colores por tipo de carta

const TYPE_COLORS = {
  Clase:     { border: '#8b2626', badge: '#5c1d1d', badgeText: '#ffd1d1' },
  Subclase:  { border: '#7a3e1d', badge: '#4a2511', badgeText: '#ffe0cc' },
  Linaje:    { border: '#2b528f', badge: '#1c355e', badgeText: '#d0e2ff' },
  Ancestro:  { border: '#1a4a8b', badge: '#1a4a8b', badgeText: '#a0c4ff' },
  Comunidad: { border: '#2b7546', badge: '#1c4a2c', badgeText: '#d1f2db' },
  Dominio:   { border: '#61337d', badge: '#3a1f4a', badgeText: '#ebd1fa' },
  Homebrew:  { border: '#635e23', badge: '#3b3815', badgeText: '#f5f0b8' },
  default:   { border: '#4a3728', badge: '#4a3728', badgeText: '#e8dcc8' },
};


/**
 * CardVault — Bóveda de cartas del jugador.
 *
 * Carga todas las cartas desde /api/cards y las muestra en una cuadrícula.
 * Cada carta renderiza su descripción con el parser de Markdown, resaltando
 * visualmente los costes (ej: **Gasta 1 Esperanza** → texto dorado + negrita).
 *
 * El botón "Jugar en la Mesa" emite un evento CARD_PLAYED via WebSocket,
 * visible en tiempo real para todos los jugadores en el SharedRollLog.
 */
export default function CardVault() {
  const { sendTableAction, connected } = useWebSocket();
  const { character } = useCharacter();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playedCardId, setPlayedCardId] = useState(null); // Feedback visual
  const [isDomainSelectorOpen, setIsDomainSelectorOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Cargar cartas desde el backend
  // -------------------------------------------------------------------------
  useEffect(() => {
    fetch('http://localhost:8080/api/cards')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setCards(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[VTT] Error cargando cartas:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // -------------------------------------------------------------------------
  // Acción: Jugar carta en la mesa
  // -------------------------------------------------------------------------
  function handlePlayCard(card) {
    const playerName = character?.nombre ?? 'Jugador Desconocido';

    sendTableAction('CARD_PLAYED', playerName, {
      id:          card.id,
      titulo:      card.titulo,
      tipo:        card.tipo,
      nivel:       card.nivel,
      descripcion: card.descripcion,
    });

    // Feedback visual temporal (200ms)
    setPlayedCardId(card.id);
    setTimeout(() => setPlayedCardId(null), 800);
  }

  // -------------------------------------------------------------------------
  // Render: estados de carga/error
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>🃏 Bóveda de Cartas</h3>
        <p style={styles.statusText}>⏳ Cargando cartas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>🃏 Bóveda de Cartas</h3>
        <p style={styles.errorText}>⚠️ Error: {error}</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>🃏 Bóveda de Cartas</h3>
        <p style={styles.statusText}>No hay cartas disponibles.</p>
      </div>
    );
  }

  const activeIds = character?.cartasActivasIds || [];
  const displayedCards = activeIds.length > 0
    ? cards.filter((c) => activeIds.includes(c.id))
    : cards;

  // -------------------------------------------------------------------------
  // Render: cuadrícula de cartas
  // -------------------------------------------------------------------------
  return (
    <div style={styles.container}>
      <div style={styles.vaultHeaderRow}>
        <div style={styles.titleGroup}>
          <h3 style={styles.title}>🃏 Bóveda y Mano Activa</h3>
          <span style={styles.activeCountBadge}>
            {activeIds.length > 0 ? `${displayedCards.length} en mano` : 'Catálogo General'}
          </span>
        </div>
        <button
          onClick={() => setIsDomainSelectorOpen(true)}
          style={styles.btnOpenSelector}
        >
          + Gestionar Dominios / Homebrew
        </button>
      </div>

      {displayedCards.length === 0 ? (
        <div style={styles.emptyNotice}>
          <p style={styles.emptyNoticeText}>
            No tienes cartas activas en tu mano. Pulsa en "+ Gestionar Dominios" para elegir tus habilidades.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {displayedCards.map((card) => {
            const colors = TYPE_COLORS[card.tipo] ?? TYPE_COLORS.default;
            const isBeingPlayed = playedCardId === card.id;

            return (
              <div
                key={card.id}
                style={{
                  ...styles.card,
                  borderColor: colors.border,
                  transform: isBeingPlayed ? 'scale(0.97)' : 'scale(1)',
                  boxShadow: isBeingPlayed
                    ? `0 0 12px ${colors.border}80`
                    : 'none',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >

              {/* Cabecera de la carta */}
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>{card.titulo}</span>
                <span
                  style={{
                    ...styles.typeBadge,
                    backgroundColor: colors.badge,
                    color: colors.badgeText,
                  }}
                >
                  {card.tipo}
                </span>
              </div>

              {/* Nivel */}
              <div style={styles.cardLevel}>Nivel {card.nivel}</div>

              {/* Descripción con Markdown */}
              <div style={styles.cardBody}>
                <MarkdownText text={card.descripcion} />
              </div>

              {/* Botón jugar */}
              <button
                onClick={() => handlePlayCard(card)}
                disabled={!connected}
                style={connected ? styles.playButton : styles.playButtonDisabled}
                title={!connected ? 'Sin conexión al servidor' : `Jugar "${card.titulo}" en la mesa`}
              >
                ▶ Jugar en la Mesa
              </button>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal para gestionar selección restringida de dominios y material Homebrew */}
      <DomainSelector
        isOpen={isDomainSelectorOpen}
        onClose={() => setIsDomainSelectorOpen(false)}
      />
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
    gap: '12px',
  },
  vaultHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #4a3728',
    paddingBottom: '10px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    color: '#d4af37',
    margin: 0,
    fontSize: '1.05rem',
  },
  activeCountBadge: {
    backgroundColor: '#241a0e',
    color: '#a0906a',
    border: '1px solid #4a3728',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
  },
  btnOpenSelector: {
    backgroundColor: '#8b1a1a',
    color: '#f5e6d3',
    border: '1px solid #d4af37',
    borderRadius: '5px',
    padding: '6px 14px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
  },
  emptyNotice: {
    padding: '30px 20px',
    textAlign: 'center',
    backgroundColor: '#140c06',
    border: '1px dashed #3a2a1a',
    borderRadius: '6px',
  },
  emptyNoticeText: {
    margin: 0,
    color: '#a0906a',
    fontSize: '0.88rem',
    fontStyle: 'italic',
  },

  statusText: {
    color: '#7a6a5a',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px 0',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: '0.9rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    gap: '14px',
  },
  card: {
    border: '1px solid #4a3728',
    borderRadius: '8px',
    backgroundColor: '#241a0e',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  cardTitle: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    lineHeight: '1.3',
    flex: 1,
  },
  typeBadge: {
    borderRadius: '3px',
    padding: '2px 7px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  cardLevel: {
    color: '#7a6a5a',
    fontSize: '0.75rem',
    fontStyle: 'italic',
  },
  cardBody: {
    flex: 1,
    borderTop: '1px solid #3a2a1a',
    paddingTop: '8px',
    minHeight: '60px',
  },
  playButton: {
    marginTop: '4px',
    width: '100%',
    padding: '7px',
    backgroundColor: 'transparent',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '5px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  playButtonDisabled: {
    marginTop: '4px',
    width: '100%',
    padding: '7px',
    backgroundColor: 'transparent',
    color: '#4a3728',
    border: '1px solid #4a3728',
    borderRadius: '5px',
    fontSize: '0.82rem',
    cursor: 'not-allowed',
  },
};
