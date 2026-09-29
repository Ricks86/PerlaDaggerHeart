import React, { useState, useEffect, useMemo } from 'react';

/**
 * Calcula el Tier máximo permitido según las reglas de nivel de Daggerheart:
 *  - Nivel 1        → Tier 1
 *  - Niveles 2 al 4 → Tier 2 o inferior
 *  - Niveles 5 al 7 → Tier 3 o inferior
 *  - Niveles 8 al 10→ Tier 4 o inferior
 */
function getMaxAllowedTier(level) {
  const lvl = parseInt(level, 10) || 1;
  if (lvl <= 1) return 1;
  if (lvl <= 4) return 2;
  if (lvl <= 7) return 3;
  return 4;
}

/**
 * GiftItemModal: Modal del DJ para entregar botín a un personaje en tiempo real (Sprint 18).
 * Filtra automáticamente el compendio de objetos por el Tier permitido según el nivel.
 */
export default function GiftItemModal({ character, onClose, onSuccess }) {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // 'ALL' | 'Arma' | 'Armadura' | 'Consumible'
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const characterLevel = character?.nivel || 1;
  const maxTier = getMaxAllowedTier(characterLevel);

  // Cargar catálogo completo de objetos desde /api/items
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch('/api/items')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setAllItems(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[GiftItemModal] Error cargando items:', err);
          setErrorMsg('No se pudo cargar el compendio de objetos.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtrado reactivo: primero por Tier <= maxTier, luego por categoría y búsqueda
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Restricción estricta de Tier por Nivel
      const itemTier = item.tier || 1;
      if (itemTier > maxTier) return false;

      // 2. Filtro de Categoría
      if (selectedCategory !== 'ALL' && item.tipo !== selectedCategory) {
        return false;
      }

      // 3. Buscador por texto
      if (searchText.trim()) {
        const query = searchText.toLowerCase().trim();
        const matchName = item.nombre?.toLowerCase().includes(query);
        const matchDesc = item.descripcion?.toLowerCase().includes(query);
        const matchTrait = item.rasgo?.toLowerCase().includes(query);
        const matchSpecial = item.rasgoEspecial?.toLowerCase().includes(query);
        const matchDamage = item.tipoDano?.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchTrait && !matchSpecial && !matchDamage) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, maxTier, selectedCategory, searchText]);

  // Manejador para entregar el objeto seleccionado
  const handleGiftSubmit = async () => {
    if (!character?.id || !selectedItem?.id) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/characters/${character.id}/inventory/${selectedItem.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }

      const updatedCharacter = await res.json();
      if (onSuccess) {
        onSuccess(selectedItem, updatedCharacter);
      }
      onClose();
    } catch (err) {
      console.error('[GiftItemModal] Error al entregar botín:', err);
      setErrorMsg(err.message || 'Error al entregar el objeto.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div style={styles.header}>
          <div style={styles.headerTitleRow}>
            <span style={styles.giftIcon}>🎁</span>
            <div>
              <h3 style={styles.title}>
                Dar Botín a <span style={styles.heroName}>{character.nombre}</span>
              </h3>
              <div style={styles.tierSubheader}>
                <span style={styles.levelBadge}>Nivel {characterLevel}</span>
                <span style={styles.tierLimitBadge}>
                  Tier Permitido: <strong>Tier 1 al {maxTier}</strong>
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={styles.btnClose} title="Cerrar modal">
            ✕
          </button>
        </div>

        {/* Barra de Filtros */}
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, daño, rasgo o efecto..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={styles.searchInput}
          />

          <div style={styles.categoryPills}>
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'Arma', label: '⚔️ Armas' },
              { id: 'Armadura', label: '🛡️ Armaduras' },
              { id: 'Consumible', label: '🧪 Consumibles' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={selectedCategory === cat.id ? styles.pillActive : styles.pillInactive}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mensajes de error */}
        {errorMsg && (
          <div style={styles.errorBanner}>
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {/* Lista de Catálogo con scroll */}
        <div style={styles.catalogContainer}>
          {loading ? (
            <div style={styles.centerMessage}>
              <span>⏳ Cargando compendio de objetos...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={styles.centerMessage}>
              <span style={styles.emptyIcon}>📦</span>
              <p>No se encontraron objetos de Tier ≤ {maxTier} con los filtros seleccionados.</p>
            </div>
          ) : (
            <div style={styles.itemGrid}>
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isArma = item.tipo === 'Arma';
                const isArmadura = item.tipo === 'Armadura';
                const isConsumible = item.tipo === 'Consumible';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={isSelected ? styles.itemCardSelected : styles.itemCard}
                  >
                    <div style={styles.itemCardHeader}>
                      <div style={styles.itemTitleRow}>
                        <span style={styles.itemTypeIcon}>
                          {isArma ? '⚔️' : isArmadura ? '🛡️' : '🧪'}
                        </span>
                        <strong style={styles.itemName} title={item.nombre}>
                          {item.nombre}
                        </strong>
                      </div>
                      <span style={styles.tierPill}>T{item.tier || 1}</span>
                    </div>

                    <div style={styles.itemCardBody}>
                      {isArma && (
                        <div style={styles.statList}>
                          <span style={styles.statLine}>
                            🎲 <strong>{item.dadoBase}{item.modificadorDano >= 0 ? `+${item.modificadorDano}` : item.modificadorDano}</strong> {item.tipoDano}
                          </span>
                          <span style={styles.statLine}>
                            📍 {item.alcance} {item.categoria ? `• ${item.categoria}` : ''}
                          </span>
                          {item.rasgo && (
                            <span style={styles.statLine}>⚡ {item.rasgo}</span>
                          )}
                          {item.rasgoEspecial && (
                            <span style={styles.specialLine} title={item.rasgoEspecial}>
                              📜 {item.rasgoEspecial}
                            </span>
                          )}
                        </div>
                      )}

                      {isArmadura && (
                        <div style={styles.statList}>
                          <span style={styles.statLine}>
                            🛡️ Ranuras: <strong>{item.puntuacionBase}</strong>
                          </span>
                          <span style={styles.statLine}>
                            Umbrales: <strong>{item.umbralMayorBase}/{item.umbralGraveBase}</strong>
                          </span>
                          {item.rasgoEspecial && (
                            <span style={styles.specialLine} title={item.rasgoEspecial}>
                              📜 {item.rasgoEspecial}
                            </span>
                          )}
                        </div>
                      )}

                      {isConsumible && (
                        <div style={styles.statList}>
                          <span style={styles.descLine} title={item.descripcion}>
                            {item.descripcion || 'Sin descripción.'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={styles.cardFooter}>
                      <span style={isSelected ? styles.selectRadioActive : styles.selectRadio}>
                        {isSelected ? '✓ Seleccionado' : 'Seleccionar'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div style={styles.footer}>
          <div style={styles.footerInfo}>
            {selectedItem ? (
              <span style={styles.selectionPrompt}>
                Objeto seleccionado: <strong>{selectedItem.nombre}</strong> (T{selectedItem.tier || 1} {selectedItem.tipo})
              </span>
            ) : (
              <span style={styles.selectionPlaceholder}>
                Selecciona un objeto del catálogo para entregarlo al jugador.
              </span>
            )}
          </div>

          <div style={styles.footerActions}>
            <button onClick={onClose} disabled={isSubmitting} style={styles.btnCancel}>
              Cancelar
            </button>
            <button
              onClick={handleGiftSubmit}
              disabled={!selectedItem || isSubmitting}
              style={!selectedItem || isSubmitting ? styles.btnGiftDisabled : styles.btnGift}
            >
              {isSubmitting ? '⏳ Entregando...' : `🎁 Entregar a ${character.nombre}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '16px',
    backdropFilter: 'blur(3px)',
  },
  modal: {
    backgroundColor: '#150f07',
    border: '1px solid #5a3d24',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '820px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(212, 175, 55, 0.1)',
    overflow: 'hidden',
  },
  header: {
    padding: '14px 20px',
    borderBottom: '1px solid #3d2c1d',
    backgroundColor: '#1b130a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  giftIcon: {
    fontSize: '1.6rem',
  },
  title: {
    margin: 0,
    color: '#e8dcc8',
    fontSize: '1.15rem',
    letterSpacing: '0.5px',
  },
  heroName: {
    color: '#d4af37',
  },
  tierSubheader: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginTop: '4px',
  },
  levelBadge: {
    backgroundColor: '#2e1f0e',
    color: '#d4af37',
    border: '1px solid #5a3d24',
    borderRadius: '4px',
    padding: '1px 6px',
    fontSize: '0.68rem',
    fontWeight: 'bold',
  },
  tierLimitBadge: {
    color: '#a08c75',
    fontSize: '0.72rem',
  },
  btnClose: {
    backgroundColor: 'transparent',
    color: '#a08c75',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  filterBar: {
    padding: '12px 20px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: '#181008',
    borderBottom: '1px solid #2a1d12',
  },
  searchInput: {
    flex: '1 1 240px',
    backgroundColor: '#0a0704',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '7px 12px',
    color: '#e8dcc8',
    fontSize: '0.82rem',
    outline: 'none',
  },
  categoryPills: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  pillActive: {
    backgroundColor: '#3d2510',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    padding: '5px 10px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  pillInactive: {
    backgroundColor: '#0d0905',
    color: '#8c7860',
    border: '1px solid #3d2c1d',
    borderRadius: '4px',
    padding: '5px 10px',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  errorBanner: {
    backgroundColor: '#3a1212',
    color: '#ff8a80',
    borderBottom: '1px solid #6e2020',
    padding: '8px 20px',
    fontSize: '0.78rem',
    textAlign: 'center',
  },
  catalogContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    minHeight: '260px',
    backgroundColor: '#0f0a06',
  },
  centerMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 10px',
    color: '#8c7860',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '2rem',
    marginBottom: '8px',
    opacity: 0.5,
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '10px',
  },
  itemCard: {
    backgroundColor: '#150f07',
    border: '1px solid #3d2a1b',
    borderRadius: '6px',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.15s ease',
  },
  itemCardSelected: {
    backgroundColor: '#26170a',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 0 10px rgba(212, 175, 55, 0.25)',
  },
  itemCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '6px',
    marginBottom: '6px',
    borderBottom: '1px solid #2e1f13',
    paddingBottom: '4px',
  },
  itemTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    overflow: 'hidden',
  },
  itemTypeIcon: {
    fontSize: '0.85rem',
  },
  itemName: {
    color: '#e8dcc8',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tierPill: {
    backgroundColor: '#2e1f0e',
    color: '#d4af37',
    border: '1px solid #5a3d24',
    borderRadius: '3px',
    padding: '1px 5px',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  itemCardBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    margin: '4px 0',
  },
  statList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '0.7rem',
    color: '#b09e86',
  },
  statLine: {
    lineHeight: '1.3',
  },
  specialLine: {
    color: '#d4c29d',
    fontStyle: 'italic',
    fontSize: '0.66rem',
    lineHeight: '1.25',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  descLine: {
    fontSize: '0.7rem',
    color: '#9e8c75',
    lineHeight: '1.3',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    marginTop: '8px',
    paddingTop: '6px',
    borderTop: '1px solid #23160b',
    textAlign: 'center',
  },
  selectRadio: {
    fontSize: '0.68rem',
    color: '#6e5a48',
  },
  selectRadioActive: {
    fontSize: '0.7rem',
    color: '#d4af37',
    fontWeight: 'bold',
  },
  footer: {
    padding: '14px 20px',
    backgroundColor: '#1b130a',
    borderTop: '1px solid #3d2c1d',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  footerInfo: {
    flex: '1 1 280px',
  },
  selectionPrompt: {
    color: '#d4c29d',
    fontSize: '0.8rem',
  },
  selectionPlaceholder: {
    color: '#6e5a48',
    fontSize: '0.75rem',
    fontStyle: 'italic',
  },
  footerActions: {
    display: 'flex',
    gap: '8px',
  },
  btnCancel: {
    backgroundColor: '#261b11',
    color: '#a08c75',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '7px 14px',
    fontSize: '0.78rem',
    cursor: 'pointer',
  },
  btnGift: {
    backgroundColor: '#8b1a1a',
    color: '#f5e6c8',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    padding: '7px 16px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  btnGiftDisabled: {
    backgroundColor: '#2e1c1c',
    color: '#6e5555',
    border: '1px solid #4a2e2e',
    borderRadius: '4px',
    padding: '7px 16px',
    fontSize: '0.82rem',
    cursor: 'not-allowed',
  },
};
