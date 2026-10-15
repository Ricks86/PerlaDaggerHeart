import React, { useState, useEffect } from 'react';
import MarkdownText from './MarkdownText';

/**
 * Obtiene el coste de recuperación de una carta desde su metadata JSON o propiedad directa.
 */
export function getCardRecoveryCost(card) {
  if (!card) return 0;
  if (typeof card.coste_recuperacion === 'number') return card.coste_recuperacion;
  if (typeof card.costeRecuperacion === 'number') return card.costeRecuperacion;

  if (card.metadata) {
    try {
      const meta = typeof card.metadata === 'string' ? JSON.parse(card.metadata) : card.metadata;
      if (meta && typeof meta.coste_recuperacion === 'number') return meta.coste_recuperacion;
      if (meta && typeof meta.costeRecuperacion === 'number') return meta.costeRecuperacion;
      if (meta && typeof meta.recuperacion === 'number') return meta.recuperacion;
    } catch (e) {
      // Ignorar error de parseo
    }
  }
  return 0;
}

/**
 * Obtiene el nombre del dominio de una carta desde metadata si existe.
 */
export function getCardDomainName(card) {
  if (!card) return null;
  if (card.metadata) {
    try {
      const meta = typeof card.metadata === 'string' ? JSON.parse(card.metadata) : card.metadata;
      return meta.dominio || meta.domain || null;
    } catch (e) {
      // Ignorar error de parseo
    }
  }
  return null;
}

/**
 * CardSwapModal — Modal interactivo para equipar cartas de la Bóveda al Mazo Activo (Loadout).
 * Sprint 26: Reglas de espacio (máx 5) y cobro de Coste de Recuperación en estrés (Gratis vs Tensión).
 */
export default function CardSwapModal({
  isOpen,
  onClose,
  cardToEquip,
  loadoutCards = [],
  character,
  onSwapSuccess,
}) {
  const [selectedCardToVaultId, setSelectedCardToVaultId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const safeLoadoutCards = (loadoutCards || []).filter(
    (c) => c && c.tipo !== 'Homebrew' && !c.esHomebrew && !(typeof c.metadata === 'string' && (c.metadata.includes('"es_homebrew":true') || c.metadata.includes('"esHomebrew":true')))
  );

  const isLoadoutFull = safeLoadoutCards.length >= 5;

  // Preseleccionar la primera carta activa si el loadout está lleno
  useEffect(() => {
    if (isOpen && isLoadoutFull && safeLoadoutCards.length > 0) {
      setSelectedCardToVaultId(safeLoadoutCards[0].id);
    } else {
      setSelectedCardToVaultId(null);
    }
    setErrorMessage(null);
  }, [isOpen, isLoadoutFull, safeLoadoutCards.length]);

  if (!isOpen || !cardToEquip || !character) return null;

  const recoveryCost = getCardRecoveryCost(cardToEquip);
  const cardDomain = getCardDomainName(cardToEquip);

  const currentStress = character.estresActual ?? 0;
  const maxStress = character.estresMax ?? 6;
  const availableStressSlots = Math.max(0, maxStress - currentStress);
  const hasEnoughStress = availableStressSlots >= recoveryCost;

  // Ejecución de la llamada a la API
  async function handleConfirmSwap(isFree) {
    if (isLoadoutFull && !selectedCardToVaultId) {
      setErrorMessage('Debes seleccionar qué carta enviar a la Bóveda para hacer hueco en tu Loadout.');
      return;
    }

    if (!isFree && !hasEnoughStress) {
      setErrorMessage(`No dispones de suficiente espacio de estrés (${recoveryCost} requerido, ${availableStressSlots} disponible).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        cardToLoadoutId: cardToEquip.id,
        cardToVaultId: isLoadoutFull ? selectedCardToVaultId : (selectedCardToVaultId || null),
        isFreeSwap: isFree,
      };

      const res = await fetch(`/api/characters/${character.id}/domain-cards/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `Error ${res.status}: Falló el intercambio`);
      }

      const updatedCharacter = await res.json();
      if (onSwapSuccess) {
        onSwapSuccess(updatedCharacter);
      }
      onClose();
    } catch (err) {
      console.error('[CardSwapModal] Error ejecutando intercambio:', err);
      setErrorMessage(err.message || 'Error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>⬆️ Equipar en Mazo Activo</h3>
            <p style={styles.subtitle}>
              Personaje: <span style={styles.highlightText}>{character.nombre}</span> · Mazo actual:{' '}
              <span style={styles.highlightText}>{safeLoadoutCards.length} / 5</span>
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn} disabled={isSubmitting}>
            ✕
          </button>
        </div>

        {/* Mensaje de Error si lo hay */}
        {errorMessage && (
          <div style={styles.errorBanner}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Detalle de la carta a equipar */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionBadge}>Carta a Equipar</span>
            <span style={styles.recoveryCostBadge}>
              ⚡ Coste de Recuperación: <strong>{recoveryCost} Estrés</strong>
            </span>
          </div>

          <div style={styles.previewCard}>
            <div style={styles.previewCardHeader}>
              <span style={styles.previewCardTitle}>{cardToEquip.titulo}</span>
              <div style={styles.badgeGroup}>
                {cardDomain && (
                  <span style={styles.domainBadge}>{cardDomain}</span>
                )}
                <span style={styles.typeBadge}>{cardToEquip.tipo}</span>
                <span style={styles.levelBadge}>Nv. {cardToEquip.nivel}</span>
              </div>
            </div>
            <div style={styles.previewCardBody}>
              <MarkdownText text={cardToEquip.descripcion} />
            </div>
          </div>
        </div>

        {/* Validación de Espacio en Loadout (5/5) */}
        <div style={styles.section}>
          {isLoadoutFull ? (
            <div>
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>⚠️</span>
                <div>
                  <strong>Mazo Activo Lleno (5 / 5 cartas)</strong>
                  <p style={styles.warningText}>
                    Selecciona cuál de tus 5 cartas activas actuales bajará a la Bóveda para hacer hueco:
                  </p>
                </div>
              </div>

              <div style={styles.cardsList}>
                {safeLoadoutCards.map((card) => {
                  const isSelected = selectedCardToVaultId === card.id;
                  const cardDom = getCardDomainName(card);
                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCardToVaultId(card.id)}
                      style={{
                        ...styles.cardListItem,
                        borderColor: isSelected ? '#d4af37' : '#3a2a1a',
                        backgroundColor: isSelected ? '#332211' : '#1e150d',
                      }}
                    >
                      <input
                        type="radio"
                        name="cardToVault"
                        checked={isSelected}
                        onChange={() => setSelectedCardToVaultId(card.id)}
                        style={styles.radioInput}
                      />
                      <div style={styles.cardListInfo}>
                        <div style={styles.cardListRow}>
                          <span style={styles.cardListTitle}>{card.titulo}</span>
                          {cardDom && <span style={styles.cardListDomain}>{cardDom}</span>}
                          <span style={styles.cardListLevel}>Nv. {card.nivel}</span>
                        </div>
                        <span style={styles.cardListAction}>
                          {isSelected ? '⬇️ Bajará a la Bóveda' : 'Permanecerá en Loadout'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={styles.infoBox}>
              <span style={styles.infoIcon}>✨</span>
              <div>
                <strong>Espacio Disponible ({safeLoadoutCards.length} / 5)</strong>
                <p style={styles.infoText}>
                  Tu Mazo Activo tiene hueco disponible. Esta carta entrará directamente a tus cartas equipadas.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Estado de Estrés del Personaje */}
        <div style={styles.stressSection}>
          <div style={styles.stressRow}>
            <span>
              Estrés de {character.nombre}:{' '}
              <strong style={{ color: '#e8dcc8' }}>
                {currentStress} / {maxStress}
              </strong>
            </span>
            <span>
              Casillas Libres:{' '}
              <strong style={{ color: availableStressSlots > 0 ? '#4ade80' : '#ff6b6b' }}>
                {availableStressSlots}
              </strong>
            </span>
          </div>

          <div style={styles.stressTrack}>
            {Array.from({ length: maxStress }).map((_, idx) => {
              const isMarked = idx < currentStress;
              const willBeMarked = !isMarked && idx < currentStress + recoveryCost;
              return (
                <div
                  key={idx}
                  style={{
                    ...styles.stressBox,
                    backgroundColor: isMarked
                      ? '#8b1a1a'
                      : willBeMarked
                      ? '#5a1a1a'
                      : '#2a1e12',
                    borderColor: isMarked
                      ? '#ff4444'
                      : willBeMarked
                      ? '#d4af37'
                      : '#4a3728',
                  }}
                  title={
                    isMarked
                      ? 'Estrés marcado'
                      : willBeMarked
                      ? 'Coste de recuperación al equipar en tensión'
                      : 'Casilla libre'
                  }
                >
                  {isMarked ? '✕' : willBeMarked ? '⚡' : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Botones de Acción (Fase 4: Botón A vs Botón B) */}
        <div style={styles.actionGrid}>
          {/* BOTÓN A: Descanso (Gratis) */}
          <button
            type="button"
            onClick={() => handleConfirmSwap(true)}
            disabled={isSubmitting || (isLoadoutFull && !selectedCardToVaultId)}
            style={{
              ...styles.btnOption,
              ...styles.btnRest,
              opacity: isSubmitting || (isLoadoutFull && !selectedCardToVaultId) ? 0.6 : 1,
            }}
          >
            <div style={styles.btnOptionTitle}>🌿 Estamos en Descanso (Gratis)</div>
            <div style={styles.btnOptionSubtitle}>
              {isSubmitting ? 'Procesando...' : 'Sin coste de Estrés (Descanso Corto o Largo)'}
            </div>
          </button>

          {/* BOTÓN B: Acción Inmediata (Tensión / Pago de Estrés) */}
          {hasEnoughStress ? (
            <button
              type="button"
              onClick={() => handleConfirmSwap(false)}
              disabled={isSubmitting || (isLoadoutFull && !selectedCardToVaultId)}
              style={{
                ...styles.btnOption,
                ...styles.btnStress,
                opacity: isSubmitting || (isLoadoutFull && !selectedCardToVaultId) ? 0.6 : 1,
              }}
            >
              <div style={styles.btnOptionTitle}>
                ⚡ Acción Inmediata (Pagar {recoveryCost} Estrés)
              </div>
              <div style={styles.btnOptionSubtitle}>
                {isSubmitting
                  ? 'Procesando...'
                  : `Intercambio rápido en combate/tensión (${currentStress} ➔ ${currentStress + recoveryCost} Estrés)`}
              </div>
            </button>
          ) : (
            <button
              type="button"
              disabled
              style={{
                ...styles.btnOption,
                ...styles.btnStressDisabled,
              }}
              title={`Requiere ${recoveryCost} casilla(s) de Estrés libre(s), solo tienes ${availableStressSlots}`}
            >
              <div style={styles.btnOptionTitleDisabled}>⚠️ Estrés Insuficiente</div>
              <div style={styles.btnOptionSubtitleDisabled}>
                Requiere {recoveryCost} Estrés (solo tienes {availableStressSlots} libre)
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Estilos del Modal
// =============================================================================
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#181109',
    border: '2px solid #5a4230',
    borderRadius: '10px',
    maxWidth: '620px',
    width: '100%',
    maxHeight: '92vh',
    overflowY: 'auto',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.85)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    fontFamily: 'inherit',
    color: '#e8dcc8',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #4a3728',
    paddingBottom: '12px',
  },
  title: {
    margin: 0,
    fontSize: '1.2rem',
    color: '#d4af37',
    fontWeight: 'bold',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '0.85rem',
    color: '#a0906a',
  },
  highlightText: {
    color: '#f5e6d3',
    fontWeight: 'bold',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#a0906a',
    fontSize: '1.3rem',
    cursor: 'pointer',
    padding: '2px 6px',
    lineHeight: 1,
    borderRadius: '4px',
  },
  errorBanner: {
    backgroundColor: 'rgba(139, 26, 26, 0.4)',
    border: '1px solid #8b1a1a',
    color: '#ffbaba',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '0.85rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionBadge: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#a0906a',
    fontWeight: 'bold',
  },
  recoveryCostBadge: {
    fontSize: '0.82rem',
    color: '#ffcc66',
    backgroundColor: '#2a1f10',
    border: '1px solid #7a5a2a',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  previewCard: {
    backgroundColor: '#22170d',
    border: '1px solid #61337d',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  previewCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  previewCardTitle: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: '0.98rem',
  },
  badgeGroup: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  domainBadge: {
    backgroundColor: '#3a1f4a',
    color: '#ebd1fa',
    border: '1px solid #61337d',
    borderRadius: '3px',
    padding: '1px 6px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
  },
  typeBadge: {
    backgroundColor: '#2e2014',
    color: '#d0c2ab',
    borderRadius: '3px',
    padding: '1px 6px',
    fontSize: '0.72rem',
  },
  levelBadge: {
    color: '#a0906a',
    fontSize: '0.75rem',
    fontStyle: 'italic',
  },
  previewCardBody: {
    borderTop: '1px solid #3a2a1a',
    paddingTop: '8px',
    fontSize: '0.85rem',
    color: '#d5c7b3',
    maxHeight: '130px',
    overflowY: 'auto',
  },
  warningBox: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(122, 62, 29, 0.25)',
    border: '1px solid #7a3e1d',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#ffd0a8',
    fontSize: '0.85rem',
    marginBottom: '8px',
  },
  warningIcon: {
    fontSize: '1.2rem',
    lineHeight: 1,
  },
  warningText: {
    margin: '4px 0 0 0',
    color: '#e0c0a0',
    fontSize: '0.8rem',
  },
  infoBox: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(30, 70, 40, 0.25)',
    border: '1px solid #2b7546',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#c2f0d0',
    fontSize: '0.85rem',
  },
  infoIcon: {
    fontSize: '1.2rem',
    lineHeight: 1,
  },
  infoText: {
    margin: '4px 0 0 0',
    color: '#a0d4b0',
    fontSize: '0.8rem',
  },
  cardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '180px',
    overflowY: 'auto',
  },
  cardListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid #3a2a1a',
    borderRadius: '6px',
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
  },
  radioInput: {
    cursor: 'pointer',
    accentColor: '#d4af37',
  },
  cardListInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  cardListRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  cardListTitle: {
    fontWeight: 'bold',
    fontSize: '0.88rem',
    color: '#f5e6d3',
  },
  cardListDomain: {
    backgroundColor: '#3a1f4a',
    color: '#ebd1fa',
    borderRadius: '3px',
    padding: '1px 5px',
    fontSize: '0.68rem',
  },
  cardListLevel: {
    fontSize: '0.72rem',
    color: '#a0906a',
  },
  cardListAction: {
    fontSize: '0.74rem',
    color: '#d4af37',
    marginTop: '2px',
  },
  stressSection: {
    backgroundColor: '#1e150d',
    border: '1px solid #3a2a1a',
    borderRadius: '6px',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  stressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.82rem',
    color: '#b0a088',
  },
  stressTrack: {
    display: 'flex',
    gap: '6px',
  },
  stressBox: {
    flex: 1,
    height: '24px',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: '#ffcc66',
    fontWeight: 'bold',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '4px',
  },
  btnOption: {
    padding: '12px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'inherit',
    transition: 'transform 0.15s ease, opacity 0.15s ease',
  },
  btnRest: {
    backgroundColor: '#1e381e',
    border: '2px solid #2b7546',
    color: '#d1f2db',
  },
  btnStress: {
    backgroundColor: '#521919',
    border: '2px solid #a33232',
    color: '#ffd1d1',
  },
  btnStressDisabled: {
    backgroundColor: '#281c1c',
    border: '2px solid #4a2828',
    color: '#7a5a5a',
    cursor: 'not-allowed',
  },
  btnOptionTitle: {
    fontWeight: 'bold',
    fontSize: '0.92rem',
  },
  btnOptionSubtitle: {
    fontSize: '0.74rem',
    opacity: 0.85,
  },
  btnOptionTitleDisabled: {
    fontWeight: 'bold',
    fontSize: '0.92rem',
    color: '#aa6666',
  },
  btnOptionSubtitleDisabled: {
    fontSize: '0.74rem',
    color: '#886666',
  },
};
