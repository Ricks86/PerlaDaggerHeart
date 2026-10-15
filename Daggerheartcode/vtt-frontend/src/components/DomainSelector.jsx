import React, { useState, useEffect } from 'react';
import { useCharacter } from '../context/CharacterContext';
import { useCards } from '../context/CompendiumContext';
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
export default function DomainSelector({ isOpen, onClose, initialCards = [] }) {
  const { character, updateActiveCharacter } = useCharacter();

  const [activeTab, setActiveTab] = useState('DOMAINS'); // 'DOMAINS' | 'HOMEBREW'
  const { cards: catalogCards, loading: catalogLoading } = useCards();
  const allCards = initialCards && initialCards.length > 0 ? initialCards : catalogCards;
  const loading = (!initialCards || initialCards.length === 0) && catalogLoading;
  const [allowedDomains, setAllowedDomains] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Detectar dominios permitidos desde la carta de Clase del personaje
  useEffect(() => {
    if (!character?.clase || allCards.length === 0) return;

    const classCard = allCards.find(
      (c) => c.tipo === 'Clase' && c.titulo.toLowerCase() === character.clase.toLowerCase()
    );

    if (classCard?.metadata) {
      try {
        const meta = typeof classCard.metadata === 'string' ? JSON.parse(classCard.metadata) : classCard.metadata;
        if (Array.isArray(meta.dominios) && meta.dominios.length > 0) {
          setAllowedDomains(meta.dominios);
          return;
        }
      } catch (e) {
        console.warn('Error parseando metadata de clase:', e);
      }
    }

    // Fallback por defecto si no hay metadata específica
    setAllowedDomains(['Gracia', 'Medianoche']);
  }, [character?.clase, allCards]);

  if (!isOpen) return null;

  // IDs de cartas activas en la ficha
  const activeIds = character?.cartasActivasIds || [];
  const rawLoadout = Array.isArray(character?.loadout) ? character.loadout : [];
  const rawBoveda = Array.isArray(character?.boveda) ? character.boveda : [];

  // Cartas activas actuales de tipo 'Dominio'
  const activeDomainCards = allCards.filter(
    (c) => c.tipo === 'Dominio' && activeIds.includes(c.id)
  );

  // Total de cartas de dominio oficiales poseídas (en Loadout, Bóveda o Activas)
  const ownedDomainIds = new Set([
    ...rawLoadout.map((c) => c.id),
    ...rawBoveda.map((c) => c.id),
    ...activeDomainCards.map((c) => c.id),
  ]);
  const ownedDomainCardsCount = ownedDomainIds.size;
  const isLevel1Legacy = (character?.nivel || 1) === 1 && ownedDomainCardsCount < 2;

  const maxDomainCards = character?.nivel === 1 ? 2 : 2 + (character?.nivel || 1) - 1;
  const isDomainLimitReached = activeDomainCards.length >= maxDomainCards;

// Mapeo bilingüe de dominios oficiales para matching robusto
const DOMAIN_SYNONYMS = {
  arcana: ['arcana', 'arcano'],
  blade: ['blade', 'cuchilla', 'filo'],
  bone: ['bone', 'hueso'],
  codex: ['codex', 'códice', 'codice'],
  grace: ['grace', 'gracia'],
  midnight: ['midnight', 'medianoche'],
  sage: ['sage', 'sabiduría', 'sabiduria', 'sabio'],
  splendor: ['splendor', 'esplendor'],
  valor: ['valor'],
  dread: ['dread', 'pavor'],
};

function matchesDomain(cardDomain, allowedDomain) {
  if (!cardDomain || !allowedDomain) return false;
  const c = cardDomain.trim().toLowerCase();
  const a = allowedDomain.trim().toLowerCase();
  if (c === a) return true;
  for (const list of Object.values(DOMAIN_SYNONYMS)) {
    if (list.includes(c) && list.includes(a)) return true;
  }
  return false;
}

  // Comprobación de si una carta es Homebrew / Regla Casera
  const isHomebrewCard = (c) => {
    if (!c) return false;
    if (c.tipo === 'Homebrew' || Boolean(c.esHomebrew)) return true;
    if (c.metadata && typeof c.metadata === 'string' && (c.metadata.includes('"es_homebrew":true') || c.metadata.includes('"esHomebrew":true'))) {
      return true;
    }
    return false;
  };

  // Filtrado de cartas para la pestaña 'DOMAINS'
  const domainCatalog = allCards.filter((c) => {
    if (c.tipo !== 'Dominio' || isHomebrewCard(c)) return false;

    // Si la carta tiene metadatos con dominios específicos, filtrar por ellos
    if (c.metadata) {
      try {
        const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata;
        if (meta.dominio) {
          return allowedDomains.some((ad) => matchesDomain(meta.dominio, ad));
        }
      } catch {
        // ignorar error de parseo
      }
    }

    // O si la descripción/título menciona alguno de los dominios permitidos
    const textToCheck = `${c.titulo} ${c.descripcion}`.toLowerCase();
    const matchesAllowed = allowedDomains.some((d) => textToCheck.includes(d.toLowerCase()));

    // Si no tiene mención explícita o coincide, mostrarlo para no dejar el catálogo vacío
    return matchesAllowed || allowedDomains.length === 0;
  });

  // Filtrado de cartas para la pestaña 'HOMEBREW' (incluye tipo Homebrew o flag esHomebrew)
  const homebrewCatalog = allCards.filter((c) => isHomebrewCard(c));

  // Acción: Añadir carta
  function handleAddCard(card) {
    if (activeIds.includes(card.id)) return;

    const isHomebrew = isHomebrewCard(card);

    if (!isHomebrew && card.tipo === 'Dominio' && !isLevel1Legacy) {
      setFeedback('⚠️ Las cartas de dominio oficiales solo se adquieren al crear tu héroe o al subir de nivel.');
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    const updatedList = [...activeIds, card.id];
    let nextLoadout = rawLoadout.filter((c) => !isHomebrewCard(c));
    let nextBoveda = rawBoveda.filter((c) => !isHomebrewCard(c));

    // Solo cartas oficiales de Dominio se asignan al Mazo Activo (Loadout) o a la Bóveda
    if (!isHomebrew && (card.tipo === 'Dominio' || (card.metadata && typeof card.metadata === 'string' && card.metadata.includes('"dominio":')))) {
      if (nextLoadout.length < 5) {
        nextLoadout.push(card);
      } else {
        nextBoveda.push(card);
      }
    }

    updateActiveCharacter({
      cartasActivasIds: updatedList,
      loadout: nextLoadout,
      boveda: nextBoveda,
    }).then(() => {
      setFeedback(`✓ Carta "${card.titulo}" añadida.`);
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  // Acción: Quitar carta
  function handleRemoveCard(cardId, cardTitle) {
    const updatedList = activeIds.filter((id) => id !== cardId);
    const updatedLoadout = rawLoadout.filter((c) => c.id !== cardId && !isHomebrewCard(c));
    const updatedBoveda = rawBoveda.filter((c) => c.id !== cardId && !isHomebrewCard(c));

    updateActiveCharacter({
      cartasActivasIds: updatedList,
      loadout: updatedLoadout,
      boveda: updatedBoveda,
    }).then(() => {
      setFeedback(`🗑️ Carta "${cardTitle}" retirada.`);
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
            ⚔️ Cartas de Dominio ({ownedDomainCardsCount} aprendidas)
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
            {/* Banner de Nivel 1 Legacy o Banner de Compendio Oficial */}
            {isLevel1Legacy ? (
              <div style={styles.limitBanner}>
                <div style={styles.limitInfo}>
                  <span style={styles.limitLabel}>Selección Inicial Pendiente (Nivel 1):</span>
                  <span style={styles.limitCount}>
                    Cartas Elegidas: <strong>{ownedDomainCardsCount} / 2</strong>
                  </span>
                </div>
                <span style={styles.limitWarning}>
                  Selecciona tus 2 cartas de dominio iniciales de Nivel 1 para comenzar tu aventura.
                </span>
              </div>
            ) : (
              <div style={styles.compendiumNotice}>
                <div style={styles.compendiumNoticeIcon}>📜</div>
                <div>
                  <div style={styles.compendiumNoticeTitle}>
                    Compendio Oficial de Dominio · Regla de Adquisición
                  </div>
                  <div style={styles.compendiumNoticeDesc}>
                    En Daggerheart, las cartas de dominio se obtienen únicamente al crear a tu personaje (2 cartas iniciales) o al subir de nivel.
                    Las cartas que ya posees se intercambian libremente entre tu Mazo Activo y tu Bóveda desde el panel de Mazo Activo y Bóveda.
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <p style={styles.statusText}>⏳ Explorando cartas de dominio...</p>
            ) : domainCatalog.length === 0 ? (
              <p style={styles.statusText}>No se encontraron cartas de los dominios permitidos.</p>
            ) : (
              <div style={styles.cardsGrid}>
                {domainCatalog.map((card) => {
                  const isInLoadout = rawLoadout.some((c) => c.id === card.id) || activeIds.includes(card.id);
                  const isInVault = rawBoveda.some((c) => c.id === card.id);
                  const isOwned = isInLoadout || isInVault;
                  const isLevelLocked = (card.nivel || 1) > (character?.nivel || 1);

                  return (
                    <div
                      key={card.id}
                      style={{
                        ...styles.cardItem,
                        borderColor: isInLoadout
                          ? '#d4af37'
                          : isInVault
                          ? '#4a6f99'
                          : isLevelLocked
                          ? '#33241b'
                          : '#4a3728',
                        backgroundColor: isInLoadout
                          ? '#231507'
                          : isInVault
                          ? '#121922'
                          : isLevelLocked
                          ? '#100b07'
                          : '#181008',
                        opacity: !isOwned && isLevelLocked ? 0.6 : 1,
                      }}
                    >
                      <div style={styles.cardTop}>
                        <strong style={styles.cardTitle}>{card.titulo}</strong>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span style={styles.levelBadge}>Nv. {card.nivel || 1}</span>
                          {isInLoadout && (
                            <span style={styles.badgeLoadout}>⚔️ En Mazo</span>
                          )}
                          {isInVault && (
                            <span style={styles.badgeVault}>📦 En Bóveda</span>
                          )}
                        </div>
                      </div>

                      <div style={styles.cardBody}>
                        <MarkdownText text={card.descripcion} />
                      </div>

                      {/* Estado y Acciones de la Carta */}
                      <div style={styles.cardActions}>
                        {isInLoadout ? (
                          <div style={{ ...styles.statusCardBox, backgroundColor: '#331c0a', color: '#ffd285', border: '1px solid #734316' }}>
                            ⚔️ Activa en tu Mazo ({rawLoadout.length}/5)
                          </div>
                        ) : isInVault ? (
                          <div style={{ ...styles.statusCardBox, backgroundColor: '#162230', color: '#a8d2ff', border: '1px solid #2e4766' }}>
                            📦 En Bóveda (Equípala desde el panel principal)
                          </div>
                        ) : isLevel1Legacy ? (
                          // Personaje Nivel 1 con cartas pendientes por elegir
                          <button
                            onClick={() => handleAddCard(card)}
                            disabled={isLevelLocked}
                            style={isLevelLocked ? styles.btnAddDisabled : styles.btnAdd}
                          >
                            + Elegir como Carta Inicial ({ownedDomainCardsCount}/2)
                          </button>
                        ) : (
                          // Regla oficial: las cartas no adquiridas están bloqueadas
                          <div
                            style={{
                              ...styles.statusCardBox,
                              backgroundColor: '#16110d',
                              color: isLevelLocked ? '#ff8a80' : '#b3a08d',
                              border: '1px solid #3a2a1d',
                            }}
                          >
                            {isLevelLocked ? (
                              <span>🔒 Requiere Nivel {card.nivel}</span>
                            ) : (
                              <span>🔒 Se desbloquea al subir de nivel</span>
                            )}
                          </div>
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
  compendiumNotice: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    backgroundColor: '#1b1208',
    border: '1px solid #6b4c1b',
    borderRadius: '6px',
    padding: '12px 16px',
  },
  compendiumNoticeIcon: {
    fontSize: '1.4rem',
    flexShrink: 0,
  },
  compendiumNoticeTitle: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: '0.88rem',
    marginBottom: '3px',
  },
  compendiumNoticeDesc: {
    color: '#c2b39a',
    fontSize: '0.78rem',
    lineHeight: '1.35',
  },
  badgeLoadout: {
    backgroundColor: '#2e183b',
    color: '#e4bdfa',
    border: '1px solid #773ca8',
    borderRadius: '4px',
    padding: '1px 6px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
  badgeVault: {
    backgroundColor: '#192533',
    color: '#9cc7f5',
    border: '1px solid #3d5a7d',
    borderRadius: '4px',
    padding: '1px 6px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
  statusCardBox: {
    textAlign: 'center',
    padding: '7px 8px',
    borderRadius: '4px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
  },
};
