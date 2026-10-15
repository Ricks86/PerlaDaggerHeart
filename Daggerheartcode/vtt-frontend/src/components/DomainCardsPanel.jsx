import React, { useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useCharacter } from '../context/CharacterContext';
import { useCards } from '../context/CompendiumContext';
import DomainSelector from './DomainSelector';
import CardSwapModal from './CardSwapModal';
import DomainCardItem from './DomainCardItem';
import ParchmentNavDeck from './ParchmentNavDeck';

/**
 * DomainCardsPanel — Orquestador modular del panel de cartas de dominio,
 * trasfondo y modificadores homebrew del jugador (v1.0 Refactorizado).
 */
export default function DomainCardsPanel() {
  const { sendTableAction, connected } = useWebSocket();
  const { character, setCharacter } = useCharacter();
  const { cards: allCards, loading, error } = useCards();

  const [feedback, setFeedback] = useState(null);

  // Vista seleccionada: 'ACTIVE' | 'TRAITS' | 'HOMEBREW' | 'VAULT'
  const [selectedDeckView, setSelectedDeckView] = useState('ACTIVE');

  const [playedCardId, setPlayedCardId] = useState(null);
  const [isDomainSelectorOpen, setIsDomainSelectorOpen] = useState(false);
  const [cardToEquipModal, setCardToEquipModal] = useState(null);
  const [selectedActiveCardId, setSelectedActiveCardId] = useState(null);
  const [isMovingToVault, setIsMovingToVault] = useState(false);

  // -------------------------------------------------------------------------
  // Clasificación de cartas
  // -------------------------------------------------------------------------
  const activeIds = character?.cartasActivasIds || [];

  const isHomebrewCard = (c) => {
    if (!c) return false;
    if (c.tipo === 'Homebrew' || Boolean(c.esHomebrew)) return true;
    if (c.metadata && typeof c.metadata === 'string' && (c.metadata.includes('"es_homebrew":true') || c.metadata.includes('"esHomebrew":true'))) {
      return true;
    }
    return false;
  };

  const rawLoadout = character?.loadout || [];
  let loadoutCards = (Array.isArray(rawLoadout) ? rawLoadout : Object.values(rawLoadout)).filter((c) => !isHomebrewCard(c));

  const rawBoveda = character?.boveda || [];
  let bovedaCards = (Array.isArray(rawBoveda) ? rawBoveda : Object.values(rawBoveda)).filter((c) => !isHomebrewCard(c));

  // Fallback si loadout/boveda aún no están poblados en memoria
  if (loadoutCards.length === 0 && bovedaCards.length === 0 && activeIds.length > 0 && allCards.length > 0) {
    const domainCardsInHand = allCards.filter(
      (c) => activeIds.includes(c.id) && !isHomebrewCard(c) && (c.tipo === 'Dominio' || (c.metadata && typeof c.metadata === 'string' && c.metadata.includes('"dominio":')))
    );
    loadoutCards = domainCardsInHand.slice(0, 5);
    bovedaCards = domainCardsInHand.slice(5);
  }

  // Cartas de trasfondo / fundación (Clase, Linaje, Comunidad, Ancestro)
  let foundationCards = allCards.filter(
    (c) =>
      activeIds.includes(c.id) &&
      !['Dominio', 'Homebrew'].includes(c.tipo) &&
      !c.esHomebrew &&
      !loadoutCards.some((lc) => lc.id === c.id) &&
      !bovedaCards.some((bc) => bc.id === c.id)
  );

  // Fallback por títulos si cartasActivasIds solo contenía IDs numéricos de dominio
  if (foundationCards.length === 0 && allCards.length > 0 && character) {
    const titles = [character.clase, character.subclase, character.ancestro, character.comunidad]
      .filter(Boolean)
      .map((t) => t.toLowerCase().trim());
    foundationCards = allCards.filter(
      (c) => !['Dominio', 'Homebrew'].includes(c.tipo) && titles.includes(c.titulo.toLowerCase().trim())
    );
  }

  // Cartas Homebrew / Modificadores externos activos
  const homebrewCards = allCards.filter(
    (c) => activeIds.includes(c.id) && isHomebrewCard(c)
  );

  // -------------------------------------------------------------------------
  // Acciones
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

    setPlayedCardId(card.id);
    setTimeout(() => setPlayedCardId(null), 800);
  }

  async function handleSendToVault(card) {
    if (!character?.id) return;
    setIsMovingToVault(true);

    try {
      const res = await fetch(`/api/characters/${character.id}/domain-cards/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardToLoadoutId: null,
          cardToVaultId: card.id,
          isFreeSwap: true,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `Error ${res.status}`);
      }

      const updatedChar = await res.json();
      if (setCharacter) {
        setCharacter(updatedChar);
      }
      setSelectedActiveCardId(null);
      setFeedback(`✓ "${card.titulo}" enviada a la Bóveda. Espacio liberado en Loadout.`);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error('[DomainCardsPanel] Error enviando a la bóveda:', err);
      setFeedback(`⚠️ Error: ${err.message}`);
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsMovingToVault(false);
    }
  }

  async function handleRemoveHomebrew(card) {
    if (!character?.id) return;
    const updatedList = activeIds.filter((id) => id !== card.id);
    const updatedLoadout = rawLoadout.filter((c) => c.id !== card.id && !isHomebrewCard(c));
    const updatedBoveda = rawBoveda.filter((c) => c.id !== card.id && !isHomebrewCard(c));

    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...character,
          cartasActivasIds: updatedList,
          loadout: updatedLoadout,
          boveda: updatedBoveda,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = await res.json();
      if (saved && setCharacter) {
        setCharacter(saved);
      }
      setFeedback(`🗑️ Modificador Homebrew "${card.titulo}" retirado.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('[DomainCardsPanel] Error retirando carta homebrew:', err);
      setFeedback(`⚠️ Error: ${err.message}`);
      setTimeout(() => setFeedback(null), 3500);
    }
  }

  // -------------------------------------------------------------------------
  // Render: Carga o Error
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>🃏 Mazo Activo y Bóveda</h3>
        <p style={styles.statusText}>⏳ Cargando cartas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>🃏 Mazo Activo y Bóveda</h3>
        <p style={styles.errorText}>⚠️ Error: {error}</p>
      </div>
    );
  }

  // Definición de las 4 pestañas de navegación
  const deckTabs = [
    {
      id: 'ACTIVE',
      title: 'Mano Activa',
      subtitle: 'Loadout de Dominio (Máx. 5)',
      icon: '⚔️',
      countText: `${loadoutCards.length} / 5`,
    },
    {
      id: 'TRAITS',
      title: 'Clase & Linajes',
      subtitle: 'Clase · Subclase · Linaje · Comunidad',
      icon: '📜',
      countText: `${foundationCards.length} cartas`,
    },
    {
      id: 'HOMEBREW',
      title: 'Cartas Homebrew',
      subtitle: 'Modificadores Externos Pactados',
      icon: '🔮',
      countText: `${homebrewCards.length} reglas`,
    },
    {
      id: 'VAULT',
      title: 'Bóveda de Dominio',
      subtitle: 'Cartas Inactivas en Reserva',
      icon: '📦',
      countText: `${bovedaCards.length} en reserva`,
    },
  ];

  return (
    <div style={styles.container}>
      {/* Cabecera Principal */}
      <div style={styles.mainHeader}>
        <div style={styles.titleGroup}>
          <h3 style={styles.title}>🃏 Mazo Activo y Bóveda de Dominio</h3>
          <span style={styles.activeCountBadge}>
            {loadoutCards.length} / 5 cartas equipadas
          </span>
        </div>
        <button
          onClick={() => setIsDomainSelectorOpen(true)}
          style={styles.btnOpenSelector}
        >
          + Gestionar Dominios / Homebrew
        </button>
      </div>

      {feedback && <div style={styles.feedbackBanner}>{feedback}</div>}

      {/* Reglas CSS responsivas */}
      <style>{`
        .domain-cards-deck-wrapper {
          display: flex;
          gap: 18px;
          align-items: flex-start;
          width: 100%;
        }
        .domain-cards-cards-col {
          flex: 1 1 0%;
          min-width: 0;
        }
        .domain-cards-parchment-deck {
          flex: 0 0 240px;
          width: 240px;
        }
        @media (max-width: 980px) {
          .domain-cards-deck-wrapper {
            flex-direction: column-reverse;
          }
          .domain-cards-parchment-deck {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 10px;
          }
        }
      `}</style>

      {/* Contenedor principal: Columna de Cartas + Botonera de Pergamino */}
      <div className="domain-cards-deck-wrapper" style={styles.deckWrapper}>
        <div className="domain-cards-cards-col" style={styles.cardsColumn}>
          {/* ================================================================= */}
          {/* VISTA 1: MANO ACTIVA / LOADOUT (Máx. 5)                           */}
          {/* ================================================================= */}
          {selectedDeckView === 'ACTIVE' && (
            <div style={styles.sectionBlock}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitleRow}>
                  <h4 style={styles.sectionTitle}>⚔️ Mazo Activo / Loadout</h4>
                  <span
                    style={{
                      ...styles.capacityBadge,
                      backgroundColor: loadoutCards.length >= 5 ? '#5a2211' : '#1e381e',
                      color: loadoutCards.length >= 5 ? '#ffd0a8' : '#c2f0d0',
                      borderColor: loadoutCards.length >= 5 ? '#a33211' : '#2b7546',
                    }}
                  >
                    {loadoutCards.length} / 5 {loadoutCards.length >= 5 ? '(Completo)' : '(Huecos Libres)'}
                  </span>
                </div>
                <span style={styles.sectionHint}>
                  Habilidades y efectos pasivos activos. Pulsa una carta para gestionarla o enviarla a la Bóveda.
                </span>
              </div>

              {loadoutCards.length === 0 ? (
                <div style={styles.emptyNotice}>
                  <p style={styles.emptyNoticeText}>
                    No tienes cartas de dominio equipadas en tu Mazo Activo.
                    Puedes equipar cartas desde tu pestaña de Bóveda o pulsar "+ Gestionar Dominios / Homebrew".
                  </p>
                </div>
              ) : (
                <div style={styles.grid}>
                  {loadoutCards.map((card) => (
                    <DomainCardItem
                      key={card.id}
                      card={card}
                      mode="active"
                      isSelected={selectedActiveCardId === card.id}
                      isBeingPlayed={playedCardId === card.id}
                      onClick={() => setSelectedActiveCardId(selectedActiveCardId === card.id ? null : card.id)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayCard(card);
                        }}
                        disabled={!connected}
                        style={connected ? styles.playButton : styles.playButtonDisabled}
                        title={!connected ? 'Sin conexión al servidor' : `Jugar "${card.titulo}" en la mesa`}
                      >
                        ▶ Jugar en la Mesa
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendToVault(card);
                        }}
                        disabled={isMovingToVault}
                        style={styles.btnSendToVault}
                        title="Enviar esta carta a la Bóveda para liberar hueco en tu Loadout"
                      >
                        ⬇️ Enviar a Bóveda
                      </button>
                    </DomainCardItem>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* VISTA 2: RASGOS DE CLASE, SUBCLASE, LINAJE Y COMUNIDAD (4 Cartas) */}
          {/* ================================================================= */}
          {selectedDeckView === 'TRAITS' && (
            <div style={styles.sectionBlock}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitleRow}>
                  <h4 style={{ ...styles.sectionTitle, color: '#e8dcff' }}>
                    📜 Rasgos de Clase, Subclase, Linaje y Comunidad ({foundationCards.length})
                  </h4>
                  <span
                    style={{
                      ...styles.capacityBadge,
                      backgroundColor: '#2b1d3d',
                      color: '#dcd2fa',
                      borderColor: '#513d80',
                    }}
                  >
                    4 Cartas Base de Trasfondo
                  </span>
                </div>
                <span style={styles.sectionHint}>
                  Identidad y origen de tu héroe (Clase, Subclase, Linaje y Comunidad). Siempre activas y fuera del límite de dominio.
                </span>
              </div>

              {foundationCards.length === 0 ? (
                <div style={styles.emptyNotice}>
                  <p style={styles.emptyNoticeText}>
                    No se han encontrado cartas de rasgos de trasfondo para este personaje.
                  </p>
                </div>
              ) : (
                <div style={styles.grid}>
                  {foundationCards.map((card) => (
                    <DomainCardItem
                      key={card.id}
                      card={card}
                      mode="traits"
                      isBeingPlayed={playedCardId === card.id}
                    >
                      <button
                        type="button"
                        onClick={() => handlePlayCard(card)}
                        disabled={!connected}
                        style={connected ? styles.playButton : styles.playButtonDisabled}
                        title={!connected ? 'Sin conexión al servidor' : `Jugar "${card.titulo}" en la mesa`}
                      >
                        ▶ Jugar en la Mesa
                      </button>
                    </DomainCardItem>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* VISTA 3: MODIFICADORES EXTERNOS / CARTAS HOMEBREW                 */}
          {/* ================================================================= */}
          {selectedDeckView === 'HOMEBREW' && (
            <div style={styles.sectionBlock}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitleRow}>
                  <h4 style={{ ...styles.sectionTitle, color: '#f5f0b8' }}>
                    🔮 Modificadores Externos / Cartas Homebrew ({homebrewCards.length})
                  </h4>
                  <span
                    style={{
                      ...styles.capacityBadge,
                      backgroundColor: '#3b3815',
                      color: '#f5f0b8',
                      borderColor: '#635e23',
                    }}
                  >
                    Reglas Acordadas (Sin Límite)
                  </span>
                </div>
                <span style={styles.sectionHint}>
                  Efectos y modificaciones acordadas con el Director de Juego. Actúan de forma externa sin ocupar huecos de dominio activo.
                </span>
              </div>

              {homebrewCards.length === 0 ? (
                <div style={styles.emptyNotice}>
                  <p style={styles.emptyNoticeText}>
                    No tienes cartas de modificación Homebrew añadidas actualmente.
                    Pulsa "+ Gestionar Dominios / Homebrew" para incorporar reglas especiales acordadas con el DJ.
                  </p>
                </div>
              ) : (
                <div style={styles.grid}>
                  {homebrewCards.map((card) => (
                    <DomainCardItem
                      key={card.id}
                      card={card}
                      mode="homebrew"
                      isBeingPlayed={playedCardId === card.id}
                    >
                      <button
                        type="button"
                        onClick={() => handlePlayCard(card)}
                        disabled={!connected}
                        style={connected ? styles.playButton : styles.playButtonDisabled}
                      >
                        ▶ Jugar en la Mesa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveHomebrew(card)}
                        style={styles.btnRemoveHomebrew}
                        title="Retirar este modificador de tu hoja"
                      >
                        ✕ Retirar Modificador
                      </button>
                    </DomainCardItem>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* VISTA 4: BÓVEDA / VAULT (Inactivas en Reserva)                     */}
          {/* ================================================================= */}
          {selectedDeckView === 'VAULT' && (
            <div style={styles.sectionBlock}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitleRow}>
                  <h4 style={styles.sectionTitleVault}>📦 Bóveda / Vault</h4>
                  <span style={styles.vaultCountBadge}>
                    {bovedaCards.length} en reserva (inactivas)
                  </span>
                </div>
                <span style={styles.sectionHint}>
                  Cartas en reserva. Sus efectos pasivos no aplican hasta ser equipadas con ⬆️ Equipar.
                </span>
              </div>

              {bovedaCards.length === 0 ? (
                <div style={styles.emptyNoticeVault}>
                  <p style={styles.emptyNoticeText}>
                    La Bóveda está vacía. Al subir de nivel o enviar cartas de tu loadout aquí, se guardarán en esta reserva.
                  </p>
                </div>
              ) : (
                <div style={styles.grid}>
                  {bovedaCards.map((card) => (
                    <DomainCardItem
                      key={card.id}
                      card={card}
                      mode="vault"
                    >
                      <button
                        type="button"
                        onClick={() => setCardToEquipModal(card)}
                        style={styles.btnEquipFromVault}
                        title={`Equipar "${card.titulo}" en el Mazo Activo`}
                      >
                        ⬆️ Equipar
                      </button>
                    </DomainCardItem>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna Derecha: Botonera de Pergamino Antiguo */}
        <ParchmentNavDeck
          tabs={deckTabs}
          activeTabId={selectedDeckView}
          onSelectTab={setSelectedDeckView}
        />
      </div>

      {/* Modal de Intercambio (Fase 4: CardSwapModal) */}
      <CardSwapModal
        isOpen={Boolean(cardToEquipModal)}
        onClose={() => setCardToEquipModal(null)}
        cardToEquip={cardToEquipModal}
        loadoutCards={loadoutCards}
        character={character}
        onSwapSuccess={(updated) => {
          if (setCharacter) {
            setCharacter(updated);
          }
          setFeedback(`✓ Carta equipada con éxito en tu Mazo Activo.`);
          setTimeout(() => setFeedback(null), 3000);
        }}
      />

      {/* Modal Selector de Cartas de Dominio / Homebrew */}
      {isDomainSelectorOpen && (
        <DomainSelector
          isOpen={isDomainSelectorOpen}
          onClose={() => setIsDomainSelectorOpen(false)}
          character={character}
          onCardClaimed={(updated) => {
            if (setCharacter) {
              setCharacter(updated);
            }
          }}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#1a1108',
    border: '1px solid #4a3728',
    borderRadius: '8px',
    padding: '20px',
    color: '#e8dcc8',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  mainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #5a4230',
    paddingBottom: '12px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#d4af37',
  },
  activeCountBadge: {
    backgroundColor: '#3a2010',
    color: '#deb887',
    border: '1px solid #735028',
    borderRadius: '12px',
    padding: '2px 10px',
    fontSize: '0.80rem',
    fontWeight: 'bold',
  },
  btnOpenSelector: {
    padding: '8px 14px',
    backgroundColor: '#3d2610',
    color: '#deb887',
    border: '1px solid #735028',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  feedbackBanner: {
    backgroundColor: '#2a1a08',
    color: '#deb887',
    border: '1px solid #735028',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '0.88rem',
  },
  deckWrapper: {
    display: 'flex',
    gap: '18px',
    alignItems: 'flex-start',
    width: '100%',
  },
  cardsColumn: {
    flex: '1 1 0%',
    minWidth: 0,
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderBottom: '1px dashed #3a2a1a',
    paddingBottom: '8px',
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
  },
  sectionTitle: {
    color: '#e8dcc8',
    margin: 0,
    fontSize: '1.02rem',
    fontWeight: 'bold',
  },
  sectionTitleVault: {
    color: '#a0906a',
    margin: 0,
    fontSize: '1.02rem',
    fontWeight: 'bold',
  },
  capacityBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    border: '1px solid',
  },
  vaultCountBadge: {
    backgroundColor: '#20160d',
    color: '#8a7a60',
    border: '1px solid #3a2a1a',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.75rem',
  },
  sectionHint: {
    color: '#8a7a60',
    fontSize: '0.78rem',
  },
  emptyNotice: {
    padding: '28px 20px',
    textAlign: 'center',
    backgroundColor: '#140c06',
    border: '1px dashed #3a2a1a',
    borderRadius: '6px',
  },
  emptyNoticeVault: {
    padding: '24px 20px',
    textAlign: 'center',
    backgroundColor: '#110a05',
    border: '1px dashed #2a1e12',
    borderRadius: '6px',
  },
  emptyNoticeText: {
    margin: 0,
    color: '#8a7a60',
    fontSize: '0.85rem',
    fontStyle: 'italic',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '14px',
  },
  playButton: {
    width: '100%',
    padding: '6px',
    backgroundColor: 'transparent',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '5px',
    fontSize: '0.80rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  playButtonDisabled: {
    width: '100%',
    padding: '6px',
    backgroundColor: 'transparent',
    color: '#4a3728',
    border: '1px solid #4a3728',
    borderRadius: '5px',
    fontSize: '0.80rem',
    cursor: 'not-allowed',
  },
  btnSendToVault: {
    width: '100%',
    padding: '5px',
    backgroundColor: '#1b130a',
    color: '#a0906a',
    border: '1px solid #4a3728',
    borderRadius: '5px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  },
  btnRemoveHomebrew: {
    width: '100%',
    padding: '5px',
    backgroundColor: '#261b0a',
    color: '#d4b26f',
    border: '1px solid #634b1d',
    borderRadius: '5px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  },
  btnEquipFromVault: {
    width: '100%',
    padding: '7px',
    backgroundColor: '#2e1f10',
    color: '#ffd070',
    border: '1px solid #d4af37',
    borderRadius: '5px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
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
    textAlign: 'center',
  },
};
