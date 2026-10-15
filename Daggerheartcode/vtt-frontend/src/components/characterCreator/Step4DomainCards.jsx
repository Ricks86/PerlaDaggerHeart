import React from 'react';
import MarkdownText from '../MarkdownText';
import { getCardRecoveryCost, getCardDomainName } from '../CardSwapModal';
import { creatorStyles as styles } from './characterCreatorStyles';

export default function Step4DomainCards({
  claseMetadata,
  selectedDomainCardIds,
  toggleDomainCard,
  filterDomainStep4,
  setFilterDomainStep4,
  filteredDomainCards,
  loadingCards,
  cards,
  onBack,
  onNext,
  setErrorMsg,
}) {
  const isComplete = selectedDomainCardIds.length === 2;

  const handleProceed = () => {
    if (!isComplete) {
      setErrorMsg('Debes seleccionar exactamente 2 cartas de dominio de Nivel 1.');
      return;
    }
    setErrorMsg(null);
    onNext();
  };

  return (
    <div style={styles.stepContent}>
      <div style={styles.stepIntro}>
        <h4 style={styles.stepSubtitle}>🃏 Cartas de Dominio Iniciales (Nivel 1)</h4>
        <p style={styles.stepDesc}>
          En Daggerheart, todo héroe comienza su viaje eligiendo exactamente{' '}
          <strong style={{ color: '#d4af37' }}>2 cartas de dominio de Nivel 1</strong> pertenecientes a los dominios de su clase (
          <strong style={{ color: '#d4af37' }}>{(claseMetadata.dominios || []).join(' y ')}</strong>).
          Estas cartas constituirán tu <strong style={{ color: '#e8dcc8' }}>Mazo Activo (Loadout)</strong> inicial.
        </p>
      </div>

      {/* Barra de estado y filtros de dominio */}
      <div style={styles.domainSummaryBar}>
        <div style={styles.domainSummaryLeft}>
          <span style={styles.domainSummaryTitle}>Selección de Dominio:</span>
          <span style={isComplete ? styles.countBadgeValid : styles.countBadgePending}>
            {isComplete
              ? '✓ 2 de 2 seleccionadas'
              : `${selectedDomainCardIds.length} / 2 seleccionadas`}
          </span>
        </div>

        {/* Filtro rápido por dominio */}
        <div style={styles.filterControl}>
          <label style={styles.filterLabel}>Filtrar Dominio:</label>
          <select
            value={filterDomainStep4}
            onChange={(e) => setFilterDomainStep4(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">Todos los dominios permitidos</option>
            {(claseMetadata.dominios || []).map((dom) => (
              <option key={dom} value={dom}>
                {dom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cartas seleccionadas pills */}
      {selectedDomainCardIds.length > 0 && (
        <div style={styles.selectedWeaponsBar}>
          <span style={styles.selectedWeaponsLabel}>Cartas elegidas:</span>
          <div style={styles.selectedWeaponsPills}>
            {selectedDomainCardIds.map((cId) => {
              const card = cards.find((c) => c.id === cId);
              const domName = getCardDomainName(card);
              return (
                <span key={cId} style={styles.domainPill}>
                  {domName ? `[${domName}] ` : ''}
                  {card?.titulo || `Carta #${cId}`}
                  <button
                    type="button"
                    onClick={() => toggleDomainCard(cId)}
                    style={styles.btnRemovePill}
                    title="Quitar selección"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Catálogo de cartas de dominio de Nivel 1 */}
      {loadingCards ? (
        <p style={styles.loadingItemsText}>Cargando cartas de dominio...</p>
      ) : filteredDomainCards.length === 0 ? (
        <div style={styles.emptyFilterBox}>
          <p style={styles.emptyItemsText}>
            No se encontraron cartas de Nivel 1 para los dominios de tu clase (
            {(claseMetadata.dominios || []).join(', ')}).
          </p>
        </div>
      ) : (
        <div style={styles.domainPickerGrid}>
          {filteredDomainCards.map((card) => {
            const isSelected = selectedDomainCardIds.includes(card.id);
            const isMaxReached = selectedDomainCardIds.length >= 2 && !isSelected;
            const domainName = getCardDomainName(card);
            const recCost = getCardRecoveryCost(card);

            return (
              <div
                key={card.id}
                onClick={() => toggleDomainCard(card.id)}
                style={{
                  ...styles.domainCardItem,
                  ...(isSelected ? styles.domainCardSelected : {}),
                  ...(isMaxReached ? styles.domainCardDimmed : {}),
                }}
              >
                <div style={styles.domainCardTop}>
                  <span style={styles.domainBadge}>
                    {domainName || 'Dominio'}
                  </span>
                  <span style={styles.domainLevelBadge}>Nv. {card.nivel || 1}</span>
                </div>

                <h5 style={styles.domainCardTitle}>{card.titulo}</h5>

                <div style={styles.domainCardMetaRow}>
                  <span style={styles.recoveryCostBadge}>
                    🔄 Recuperación: {recCost} Estrés
                  </span>
                </div>

                <div style={styles.domainCardDesc}>
                  <MarkdownText text={card.descripcion} />
                </div>

                <div style={styles.domainCardFooter}>
                  {isSelected ? (
                    <span style={styles.tagSelectedCard}>✓ Seleccionada (Click para desmarcar)</span>
                  ) : isMaxReached ? (
                    <span style={styles.tagMaxReached}>Límite 2 alcanzado</span>
                  ) : (
                    <span style={styles.tagAvailableCard}>+ Seleccionar Carta</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.navRow}>
        <button onClick={onBack} style={styles.btnBack}>
          ⬅ Volver a Experiencias
        </button>
        <button
          onClick={handleProceed}
          disabled={!isComplete}
          style={!isComplete ? styles.btnDisabled : styles.btnNext}
        >
          Siguiente: Equipamiento Inicial ➔
        </button>
      </div>
    </div>
  );
}
