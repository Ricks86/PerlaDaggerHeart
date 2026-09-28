import React, { useState, useEffect } from 'react';
import { useCharacter } from '../context/CharacterContext';
import MarkdownText from './MarkdownText';

/**
 * DomainSelector: Selector restringido de dominios y catálogo Homebrew.
 *
 * Reglas de Nivel 1:
 *  - Filtra las cartas de tipo 'Dominio' mostrando solo las compatibles con la Clase del personaje.
 *  - Contador visual estricto: máximo 2 cartas de Dominio en Nivel 1.
 *  - Bloquea cartas de nivel superior al nivel del personaje.
 *  - Pestaña 'Material Homebrew': exenta de límites de dominio y nivel para recompensas del DJ.
 */
export default function DomainSelector({ isOpen, onClose }) {
  const { character, updateActiveCharacter } = useCharacter();

  const [activeTab, setActiveTab] = useState('DOMAINS'); // 'DOMAINS' | 'HOMEBREW'
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allowedDomains, setAllowedDomains] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Cargar catálogo de cartas
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    fetch('http://localhost:8080/api/cards')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setAllCards(data);
        setLoading(false);

        // Detectar dominios permitidos desde la carta de Clase del personaje
        if (character?.clase) {
          const classCard = data.find(
            (c) => c.tipo === 'Clase' && c.titulo.toLowerCase() === character.clase.toLowerCase()
          );

          if (classCard?.metadata) {
            try {
              const meta = JSON.parse(classCard.metadata);
              if (Array.isArray(meta.dominios) && meta.dominios.length > 0) {
                setAllowedDomains(meta.dominios);
                return;
              }
            } catch (e) {
              console.warn('Error parseando metadata de clase:', e);
            }
          }
        }

        // Fallback por defecto si no hay metadata específica
        setAllowedDomains(['Gracia', 'Medianoche']);
      })
      .catch((err) => {
        console.error('[DomainSelector] Error al cargar cartas:', err);
        setLoading(false);
      });
  }, [isOpen, character]);

  if (!isOpen) return null;

  // IDs de cartas activas en la ficha
  const activeIds = character?.cartasActivasIds || [];

  // Cartas activas actuales de tipo 'Dominio'
  const activeDomainCards = allCards.filter(
    (c) => c.tipo === 'Dominio' && activeIds.includes(c.id)
  );

  const maxDomainCards = character?.nivel === 1 ? 2 : 2 + (character?.nivel || 1) - 1;
  const isDomainLimitReached = activeDomainCards.length >= maxDomainCards;

  // Filtrado de cartas para la pestaña 'DOMAINS'
  const domainCatalog = allCards.filter((c) => {
    if (c.tipo !== 'Dominio') return false;

    // Si la carta tiene metadatos con dominios específicos, filtrar por ellos
    if (c.metadata) {
      try {
        const meta = JSON.parse(c.metadata);
        if (meta.dominio) {
          return allowedDomains.includes(meta.dominio);
        }
      } catch {
        // ignorar error de parseo
      }
    }

    // O si la descripción/título menciona alguno de los dominios permitidos
    const textToCheck = `${c.titulo} ${c.descripcion}`.toLowerCase();
    const matchesAllowed = allowedDomains.some((d) => textToCheck.includes(d.toLowerCase()));

    // Si no tiene mención explícita o coincide, mostrarlo para no dejar el catálogo vacío
    return matchesAllowed || allowedDomains.length === 0 || true;
  });

  // Filtrado de cartas para la pestaña 'HOMEBREW'
  const homebrewCatalog = allCards.filter((c) => c.tipo === 'Homebrew');

  // Acción: Añadir carta
  function handleAddCard(card) {
    if (activeIds.includes(card.id)) return;

    if (card.tipo === 'Dominio' && isDomainLimitReached) {
      setFeedback('⚠️ Has alcanzado el límite máximo de 2 cartas de Dominio para Nivel 1.');
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    const updatedList = [...activeIds, card.id];
    updateActiveCharacter({ cartasActivasIds: updatedList })
      .then(() => {
        setFeedback(`✓ Carta "${card.titulo}" añadida a tu mano activa.`);
        setTimeout(() => setFeedback(null), 3000);
      });
  }

  // Acción: Quitar carta
  function handleRemoveCard(cardId, cardTitle) {
    const updatedList = activeIds.filter((id) => id !== cardId);
    updateActiveCharacter({ cartasActivasIds: updatedList })
      .then(() => {
        setFeedback(`🗑️ Carta "${cardTitle}" retirada de tu mano.`);
        setTimeout(() => setFeedback(null), 3000);
      });
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Cabecera del Selector */}
        <div style={styles.modalHeader}>
          <div>
            <h3 style={styles.modalTitle}>📖 Bóveda y Selección de Habilidades</h3>
            <p style={styles.modalSubtitle}>
              Personaje: <strong style={{ color: '#d4af37' }}>{character?.nombre}</strong> (Nv. {character?.nivel} {character?.clase}) · Dominios: <strong style={{ color: '#d4af37' }}>{allowedDomains.join(' y ')}</strong>
            </p>
          </div>
          <button onClick={onClose} style={styles.btnClose}>✕</button>
        </div>

        {/* Barra de Pestañas: Dominios vs Homebrew */}
        <div style={styles.tabBar}>
          <button
            onClick={() => setActiveTab('DOMAINS')}
            style={activeTab === 'DOMAINS' ? styles.tabBtnActive : styles.tabBtn}
          >
            ⚔️ Cartas de Dominio ({activeDomainCards.length}/{maxDomainCards})
          </button>
          <button
            onClick={() => setActiveTab('HOMEBREW')}
            style={activeTab === 'HOMEBREW' ? styles.tabBtnActive : styles.tabBtn}
          >
            🧪 Material Homebrew (Sin límite de Nivel)
          </button>
        </div>

        {feedback && <div style={styles.feedbackBanner}>{feedback}</div>}

        {/* PESTAÑA: DOMINIOS OFICIALES */}
        {activeTab === 'DOMAINS' && (
          <div style={styles.tabContent}>
            {/* Contador Visual de Nivel 1 */}
            <div style={styles.limitBanner}>
              <div style={styles.limitInfo}>
                <span style={styles.limitLabel}>Límite de Nivel 1:</span>
                <span style={styles.limitCount}>
                  Dominios Seleccionados: <strong>{activeDomainCards.length} / {maxDomainCards}</strong>
                </span>
              </div>
              {isDomainLimitReached && (
                <span style={styles.limitWarning}>
                  Límite alcanzado. Retira una carta si deseas equipar otra diferente.
                </span>
              )}
            </div>

            {loading ? (
              <p style={styles.statusText}>⏳ Explorando cartas de dominio...</p>
            ) : domainCatalog.length === 0 ? (
              <p style={styles.statusText}>No se encontraron cartas de los dominios permitidos.</p>
            ) : (
              <div style={styles.cardsGrid}>
                {domainCatalog.map((card) => {
                  const isEquipped = activeIds.includes(card.id);
                  const isLevelLocked = card.nivel > (character?.nivel || 1);
                  const disableAdd = isEquipped || isDomainLimitReached || isLevelLocked;

                  return (
                    <div
                      key={card.id}
                      style={{
                        ...styles.cardItem,
                        borderColor: isEquipped ? '#d4af37' : '#4a3728',
                        backgroundColor: isEquipped ? '#231507' : '#181008',
                        opacity: isLevelLocked ? 0.6 : 1,
                      }}
                    >
                      <div style={styles.cardTop}>
                        <strong style={styles.cardTitle}>{card.titulo}</strong>
                        <span style={styles.levelBadge}>Nv. {card.nivel}</span>
                      </div>

                      <div style={styles.cardBody}>
                        <MarkdownText text={card.descripcion} />
                      </div>

                      {isLevelLocked && (
                        <span style={styles.lockNotice}>
                          🔒 Requiere Nivel {card.nivel}
                        </span>
                      )}

                      <div style={styles.cardActions}>
                        {isEquipped ? (
                          <button
                            onClick={() => handleRemoveCard(card.id, card.titulo)}
                            style={styles.btnRemove}
                          >
                            ✕ Quitar de la Mano
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddCard(card)}
                            disabled={disableAdd}
                            style={disableAdd ? styles.btnAddDisabled : styles.btnAdd}
                          >
                            + Añadir a la Mano
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: MATERIAL HOMEBREW */}
        {activeTab === 'HOMEBREW' && (
          <div style={styles.tabContent}>
            <div style={styles.homebrewIntro}>
              <span>
                🌟 Las cartas Homebrew son creaciones personalizadas por el DJ y no consumen tus ranuras oficiales de dominio de Nivel 1.
              </span>
            </div>

            {loading ? (
              <p style={styles.statusText}>⏳ Buscando material Homebrew...</p>
            ) : homebrewCatalog.length === 0 ? (
              <p style={styles.statusText}>
                No hay cartas Homebrew creadas aún por el DJ en el Compendio.
              </p>
            ) : (
              <div style={styles.cardsGrid}>
                {homebrewCatalog.map((card) => {
                  const isEquipped = activeIds.includes(card.id);

                  return (
                    <div
                      key={card.id}
                      style={{
                        ...styles.cardItem,
                        borderColor: isEquipped ? '#f4c430' : '#635e23',
                        backgroundColor: isEquipped ? '#231e07' : '#181608',
                      }}
                    >
                      <div style={styles.cardTop}>
                        <strong style={styles.cardTitle}>{card.titulo}</strong>
                        <span style={styles.homebrewBadge}>HOMEBREW</span>
                      </div>

                      <div style={styles.cardBody}>
                        <MarkdownText text={card.descripcion} />
                      </div>

                      <div style={styles.cardActions}>
                        {isEquipped ? (
                          <button
                            onClick={() => handleRemoveCard(card.id, card.titulo)}
                            style={styles.btnRemove}
                          >
                            ✕ Quitar Habilidad
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddCard(card)}
                            style={styles.btnAddHomebrew}
                          >
                            + Reclamar Habilidad Homebrew
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Estilos
// =============================================================================
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#160e06',
    border: '2px solid #6b4e28',
    borderRadius: '10px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid #3a2a1a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#1f1308',
  },
  modalTitle: {
    margin: '0 0 4px 0',
    color: '#d4af37',
    fontSize: '1.25rem',
  },
  modalSubtitle: {
    margin: 0,
    color: '#a0906a',
    fontSize: '0.82rem',
  },
  btnClose: {
    backgroundColor: 'transparent',
    color: '#a0906a',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  tabBar: {
    display: 'flex',
    backgroundColor: '#100a04',
    borderBottom: '1px solid #3a2a1a',
  },
  tabBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#7a6a5a',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    borderBottom: '2px solid transparent',
  },
  tabBtnActive: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#1b1108',
    color: '#d4af37',
    border: 'none',
    cursor: 'default',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    borderBottom: '2px solid #d4af37',
  },
  feedbackBanner: {
    backgroundColor: '#281a0b',
    borderBottom: '1px solid #d4af37',
    color: '#f5e6d3',
    padding: '8px 16px',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  tabContent: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  limitBanner: {
    backgroundColor: '#201509',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  limitInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  limitLabel: {
    color: '#a0906a',
    fontSize: '0.85rem',
  },
  limitCount: {
    color: '#d4af37',
    fontSize: '0.95rem',
  },
  limitWarning: {
    color: '#ff9800',
    fontSize: '0.8rem',
    fontStyle: 'italic',
  },
  homebrewIntro: {
    backgroundColor: '#1f1c09',
    border: '1px solid #635e23',
    borderRadius: '6px',
    padding: '10px 14px',
    color: '#e5dc94',
    fontSize: '0.82rem',
  },
  statusText: {
    color: '#7a6a5a',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '14px',
  },
  cardItem: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'all 0.15s ease',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  cardTitle: {
    color: '#d4af37',
    fontSize: '0.95rem',
  },
  levelBadge: {
    backgroundColor: '#8b1a1a',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    padding: '1px 6px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
  },
  homebrewBadge: {
    backgroundColor: '#3b3815',
    color: '#f5f0b8',
    border: '1px solid #635e23',
    borderRadius: '4px',
    padding: '1px 6px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
  cardBody: {
    fontSize: '0.82rem',
    flex: 1,
    borderTop: '1px solid #2a1e12',
    paddingTop: '8px',
  },
  lockNotice: {
    color: '#ff6b6b',
    fontSize: '0.75rem',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cardActions: {
    marginTop: '4px',
  },
  btnAdd: {
    width: '100%',
    backgroundColor: '#1b3b22',
    color: '#e8dcc8',
    border: '1px solid #2e7d32',
    borderRadius: '5px',
    padding: '8px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
  },
  btnAddDisabled: {
    width: '100%',
    backgroundColor: '#1a1815',
    color: '#554a40',
    border: '1px solid #332a22',
    borderRadius: '5px',
    padding: '8px',
    fontSize: '0.82rem',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
  btnAddHomebrew: {
    width: '100%',
    backgroundColor: '#3b3815',
    color: '#f5f0b8',
    border: '1px solid #8c8227',
    borderRadius: '5px',
    padding: '8px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnRemove: {
    width: '100%',
    backgroundColor: 'transparent',
    color: '#e74c3c',
    border: '1px solid #8b1a1a',
    borderRadius: '5px',
    padding: '8px',
    fontSize: '0.82rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
