import React, { useState, useEffect, useMemo } from 'react';
import { useCharacter } from '../context/CharacterContext';
import CardInspectorDrawer from './CardInspectorDrawer';

const TRAIT_KEYS = [
  { key: 'agilidad', label: 'Agilidad', icon: '🏃' },
  { key: 'fuerza', label: 'Fuerza', icon: '💪' },
  { key: 'sutileza', label: 'Sutileza', icon: '🎯' },
  { key: 'instinto', label: 'Instinto', icon: '👁️' },
  { key: 'presencia', label: 'Presencia', icon: '👑' },
  { key: 'conocimiento', label: 'Conocimiento', icon: '📖' },
];

export default function LevelUpModal({ character, onClose, onSuccess }) {
  const { setCharacter } = useCharacter();

  const currentLevel = character?.nivel || 1;
  const targetLevel = currentLevel + 1;
  const isTierMilestone = targetLevel === 2 || targetLevel === 5 || targetLevel === 8;
  const isNewTier = isTierMilestone;

  // Si arranca un nuevo Tier (niveles 2, 5 u 8), la UI debe partir de una bolsa en cero
  // para no heredar los contadores del Tier que el personaje está por abandonar.
  const currentTierProgression = isNewTier
    ? {
        traitsCount: 0,
        hpCount: 0,
        stressCount: 0,
        experiencesCount: 0,
        extraDomainCardsCount: 0,
        evasionCount: 0,
        markedTraitsInTier: [],
      }
    : (character?.tierProgression || {});

  const tp = currentTierProgression;
  const traitsCount = tp.traitsCount || 0;
  const hpCount = tp.hpCount || 0;
  const stressCount = tp.stressCount || 0;
  const experiencesCount = tp.experiencesCount || 0;
  const extraCardsCount = tp.extraDomainCardsCount || 0;
  const evasionCount = tp.evasionCount || 0;

  const markedTraits = useMemo(() => {
    return new Set((tp.markedTraitsInTier || []).map((t) => t.toLowerCase()));
  }, [tp.markedTraitsInTier]);

  // Estados de carga de datos
  const [allCards, setAllCards] = useState([]);
  const [allowedDomains, setAllowedDomains] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Estados del Paso 1 (Obligatorios)
  const [mandatoryCardId, setMandatoryCardId] = useState(null);
  const [newExperienceName, setNewExperienceName] = useState('');

  // Estados del Paso 2 (Bolsa de Opciones)
  const [selectedOptionTypes, setSelectedOptionTypes] = useState([]);
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [selectedExpNames, setSelectedExpNames] = useState([]);
  const [extraCardId, setExtraCardId] = useState(null);

  // Filtros visuales para catálogo de cartas de dominio
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectedCard, setInspectedCard] = useState(null);

  // 1. Cargar cartas y deducir dominios permitidos de la clase
  useEffect(() => {
    let isMounted = true;
    fetch('/api/cards')
      .then((res) => {
        if (!res.ok) throw new Error('Error al consultar cartas del compendio');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setAllCards(data);

        // Buscar dominios permitidos en la carta de Clase
        if (character?.clase) {
          const classCard = data.find(
            (c) => c.tipo === 'Clase' && c.titulo?.toLowerCase() === character.clase.toLowerCase()
          );
          if (classCard?.metadata) {
            try {
              const meta = typeof classCard.metadata === 'string'
                ? JSON.parse(classCard.metadata)
                : classCard.metadata;
              if (Array.isArray(meta.dominios) && meta.dominios.length > 0) {
                setAllowedDomains(meta.dominios);
                setLoadingCards(false);
                return;
              }
            } catch (e) {
              console.warn('Error al parsear dominios de clase:', e);
            }
          }
        }
        // Fallback predeterminado
        setAllowedDomains(['Gracia', 'Medianoche']);
        setLoadingCards(false);
      })
      .catch((err) => {
        console.error('Error cargando cartas para subida de nivel:', err);
        if (isMounted) {
          setLoadingCards(false);
          setErrorMsg('No se pudieron cargar las cartas de dominio.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [character?.clase]);

  // Filtrado de cartas de dominio elegibles para el nivel objetivo
  const eligibleDomainCards = useMemo(() => {
    return allCards.filter((card) => {
      if (card.tipo !== 'Dominio') return false;
      const cardNivel = card.nivel || 1;
      if (cardNivel > targetLevel) return false;

      // Filtrar por dominios de la clase
      if (allowedDomains.length > 0) {
        if (card.metadata) {
          try {
            const meta = typeof card.metadata === 'string' ? JSON.parse(card.metadata) : card.metadata;
            if (meta.dominio && allowedDomains.some((d) => d.toLowerCase() === meta.dominio.toLowerCase())) {
              return true;
            }
          } catch {}
        }
        const textToCheck = `${card.titulo || ''} ${card.descripcion || ''}`.toLowerCase();
        const matches = allowedDomains.some((d) => textToCheck.includes(d.toLowerCase()));
        if (matches) return true;
      }
      return allowedDomains.length === 0;
    });
  }, [allCards, targetLevel, allowedDomains]);

  // Catálogo secundario disponible para la opción EXTRA_DOMAIN_CARD (excluye la ya elegida en Paso 1)
  const secondaryDomainCards = useMemo(() => {
    const activeIds = character?.cartasActivasIds || [];
    return eligibleDomainCards.filter(
      (c) => c.id !== mandatoryCardId && !activeIds.includes(c.id)
    );
  }, [eligibleDomainCards, mandatoryCardId, character?.cartasActivasIds]);

  // Cartas filtradas por buscador en Paso 1
  const displayedDomainCards = useMemo(() => {
    if (!searchTerm.trim()) return eligibleDomainCards;
    const term = searchTerm.toLowerCase();
    return eligibleDomainCards.filter(
      (c) =>
        c.titulo?.toLowerCase().includes(term) ||
        c.descripcion?.toLowerCase().includes(term)
    );
  }, [eligibleDomainCards, searchTerm]);

  // Manejar selección de tipo de opción en la bolsa de Tier
  const toggleOptionType = (type, isLocked) => {
    if (isLocked) return;
    if (selectedOptionTypes.includes(type)) {
      setSelectedOptionTypes((prev) => prev.filter((t) => t !== type));
      // Limpiar sub-selecciones si se desmarca
      if (type === 'INCREASE_TRAITS') setSelectedTraits([]);
      if (type === 'INCREASE_EXPERIENCES') setSelectedExpNames([]);
      if (type === 'EXTRA_DOMAIN_CARD') setExtraCardId(null);
    } else {
      if (selectedOptionTypes.length >= 2) {
        // Máximo 2 opciones permitidas
        return;
      }
      setSelectedOptionTypes((prev) => [...prev, type]);
    }
  };

  // Manejo de atributos (exactamente 2)
  const toggleTrait = (traitKey) => {
    if (markedTraits.has(traitKey.toLowerCase())) return;
    if (selectedTraits.includes(traitKey)) {
      setSelectedTraits((prev) => prev.filter((k) => k !== traitKey));
    } else {
      if (selectedTraits.length >= 2) return;
      setSelectedTraits((prev) => [...prev, traitKey]);
    }
  };

  // Manejo de experiencias a mejorar (exactamente 2)
  const toggleExperience = (expName) => {
    if (selectedExpNames.includes(expName)) {
      setSelectedExpNames((prev) => prev.filter((n) => n !== expName));
    } else {
      if (selectedExpNames.length >= 2) return;
      setSelectedExpNames((prev) => [...prev, expName]);
    }
  };

  // ---------------------------------------------------------------------------
  // Validaciones
  // ---------------------------------------------------------------------------
  const isStep1Valid = useMemo(() => {
    if (!mandatoryCardId) return false;
    if (isTierMilestone && !newExperienceName.trim()) return false;
    return true;
  }, [mandatoryCardId, isTierMilestone, newExperienceName]);

  const isStep2Valid = useMemo(() => {
    if (selectedOptionTypes.length !== 2) return false;

    for (const type of selectedOptionTypes) {
      if (type === 'INCREASE_TRAITS' && selectedTraits.length !== 2) {
        return false;
      }
      if (type === 'INCREASE_EXPERIENCES' && selectedExpNames.length !== 2) {
        return false;
      }
      if (type === 'EXTRA_DOMAIN_CARD' && !extraCardId) {
        return false;
      }
    }
    return true;
  }, [selectedOptionTypes, selectedTraits, selectedExpNames, extraCardId]);

  const canSubmit = isStep1Valid && isStep2Valid && !saving;

  // ---------------------------------------------------------------------------
  // Envío al Backend
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setErrorMsg(null);

    const payload = {
      characterId: character.id,
      domainCardId: mandatoryCardId,
      newExperience: isTierMilestone
        ? { nombre: newExperienceName.trim(), valor: 2 }
        : null,
      options: selectedOptionTypes.map((type) => {
        const opt = { type };
        if (type === 'INCREASE_TRAITS') {
          opt.traits = selectedTraits;
        } else if (type === 'INCREASE_EXPERIENCES') {
          opt.experienceNames = selectedExpNames;
        } else if (type === 'EXTRA_DOMAIN_CARD') {
          opt.extraCardId = extraCardId;
        }
        return opt;
      }),
    };

    try {
      const res = await fetch(`/api/characters/${character.id}/level-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${res.status}: Subida de nivel rechazada`);
      }

      const updated = await res.json();
      setCharacter(updated);
      setSuccessMsg(`¡Enhorabuena! Has alcanzado el Nivel ${targetLevel}.`);

      if (onSuccess) onSuccess(updated);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error al subir de nivel:', err);
      setErrorMsg(err.message || 'Ocurrió un error inesperado al procesar la subida de nivel.');
      setSaving(false);
    }
  };

  const existingExps = character?.experiencias || [];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* ENCABEZADO */}
        <div style={styles.header}>
          <div>
            <div style={styles.tierTag}>
              {targetLevel <= 1 ? 'Tier 1' : targetLevel <= 4 ? 'Tier 2' : targetLevel <= 7 ? 'Tier 3' : 'Tier 4'}
            </div>
            <h2 style={styles.title}>
              ⚡ Subida a Nivel {targetLevel} de {character?.nombre}
            </h2>
            <p style={styles.subtitle}>
              Clase: <strong style={{ color: '#ffea75' }}>{character?.clase}</strong> · Dominios:{' '}
              <strong style={{ color: '#ffea75' }}>{allowedDomains.join(' · ')}</strong>
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="Cerrar ventana">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div style={styles.alertError}>
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={styles.alertSuccess}>
            <span>🎉 {successMsg}</span>
          </div>
        )}

        {/* CONTENIDO SCROLLABLE */}
        <div style={styles.scrollBody}>
          {/* ============================================================= */}
          {/* PASO 1: ENTREGABLES OBLIGATORIOS                              */}
          {/* ============================================================= */}
          <div style={styles.sectionBox}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                Paso 1: Entregables Obligatorios por Nivel
              </h3>
              <span style={isStep1Valid ? styles.badgeDone : styles.badgePending}>
                {isStep1Valid ? '✓ Completado' : '⏳ Pendiente'}
              </span>
            </div>

            {/* HITO DE TIER */}
            {isTierMilestone && (
              <div style={styles.milestoneNotice}>
                <div style={styles.milestoneIcon}>🎖️</div>
                <div style={styles.milestoneContent}>
                  <div style={styles.milestoneTitleRow}>
                    <strong style={styles.milestoneTitle}>
                      ¡Hito de Tier alcanzado al llegar a Nivel {targetLevel}!
                    </strong>
                    <span style={styles.proficiencyBadge}>+1 a Competencia (Automático)</span>
                  </div>
                  <p style={styles.milestoneDesc}>
                    Al entrar a un nuevo Tier de aventura, tu personaje amplía su marco de maestría y obtiene
                    una nueva Experiencia (+2 base).
                  </p>
                  <div style={styles.newExpInputRow}>
                    <label style={styles.label}>
                      Nueva Experiencia Obligatoria (+2):
                      <input
                        type="text"
                        value={newExperienceName}
                        onChange={(e) => setNewExperienceName(e.target.value)}
                        placeholder="ej. Rastreador de las Cavernas Sombrías, Diplomático Real..."
                        style={styles.textInput}
                        maxLength={60}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* CARTA DE DOMINIO OBLIGATORIA */}
            <div style={styles.cardSelectionSection}>
              <div style={styles.cardSelectionHeader}>
                <div>
                  <strong style={styles.label}>
                    Elige 1 Carta de Dominio (Obligatoria · Nivel ≤ {targetLevel}):
                  </strong>
                  <div style={styles.hint}>
                    Mostrando cartas de tus dominios de clase (<strong>{allowedDomains.join(', ')}</strong>).
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Buscar habilidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              {loadingCards ? (
                <div style={styles.statusBox}>⏳ Cargando catálogo de dominios...</div>
              ) : displayedDomainCards.length === 0 ? (
                <div style={styles.statusBox}>
                  No se encontraron cartas de dominio para este nivel con ese criterio.
                </div>
              ) : (
                <div style={styles.cardsGrid}>
                  {displayedDomainCards.map((card) => {
                    const isSelected = mandatoryCardId === card.id;
                    const isAlreadyActive = character?.cartasActivasIds?.includes(card.id);
                    return (
                      <div
                        key={card.id}
                        onClick={() => !isAlreadyActive && setMandatoryCardId(card.id)}
                        style={{
                          ...styles.cardItem,
                          ...(isSelected ? styles.cardItemSelected : {}),
                          ...(isAlreadyActive ? styles.cardItemDisabled : {}),
                        }}
                      >
                        <div style={styles.cardTopRow}>
                          <span style={styles.cardTypeTag}>{card.tipo}</span>
                          <span style={styles.cardLevelTag}>Nv. {card.nivel || 1}</span>
                        </div>
                        <h4 style={styles.cardTitle}>{card.titulo}</h4>
                        <p style={styles.cardDesc}>
                          {card.descripcion ? card.descripcion.slice(0, 110) + (card.descripcion.length > 110 ? '...' : '') : 'Sin descripción.'}
                        </p>
                        <div style={styles.cardBottomRow}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedCard(card);
                            }}
                            style={styles.btnInspectCard}
                            title="Ver detalles completos de la carta"
                          >
                            👁️ Ver completa
                          </button>
                          {isAlreadyActive ? (
                            <span style={styles.alreadyActiveTag}>En tu ficha</span>
                          ) : isSelected ? (
                            <span style={styles.selectedTag}>✓ Seleccionada</span>
                          ) : (
                            <span style={styles.selectBtnPlaceholder}>+ Elegir</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================= */}
          {/* PASO 2: BOLSA DE OPCIONES DEL TIER                           */}
          {/* ============================================================= */}
          <div style={styles.sectionBox}>
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.sectionTitle}>
                  Paso 2: Bolsa de Opciones del Tier ({selectedOptionTypes.length}/2 Seleccionadas)
                </h3>
                <p style={styles.sectionSubtitle}>
                  Selecciona exactamente 2 mejoras distintas de la reserva del Tier. Las opciones con su límite alcanzado están bloqueadas 🔒.
                </p>
              </div>
              <span style={isStep2Valid ? styles.badgeDone : styles.badgePending}>
                {selectedOptionTypes.length}/2 Seleccionadas
              </span>
            </div>

            <div style={styles.optionsGrid}>
              {/* 1. MEJORAR ATRIBUTOS */}
              {(() => {
                const isLocked = traitsCount >= 3;
                const isSelected = selectedOptionTypes.includes('INCREASE_TRAITS');
                return (
                  <div
                    style={{
                      ...styles.optionCard,
                      ...(isSelected ? styles.optionCardActive : {}),
                      ...(isLocked ? styles.optionCardLocked : {}),
                    }}
                  >
                    <div style={styles.optionCardHeader}>
                      <div>
                        <strong style={styles.optionTitle}>1. Mejorar Atributos</strong>
                        <div style={styles.optionLimit}>
                          Máx 3 en este Tier ({traitsCount}/3 usados)
                        </div>
                      </div>
                      {isLocked ? (
                        <span style={styles.lockBadge}>🔒 Límite</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleOptionType('INCREASE_TRAITS', isLocked)}
                          style={isSelected ? styles.btnOptionSelected : styles.btnOptionPick}
                          disabled={isLocked || (!isSelected && selectedOptionTypes.length >= 2)}
                        >
                          {isSelected ? '✓ Elegida' : '+ Seleccionar'}
                        </button>
                      )}
                    </div>
                    <p style={styles.optionDesc}>
                      Aumenta +1 a 2 atributos distintos. Los ya mejorados en este Tier no pueden repetirse.
                    </p>

                    {isSelected && (
                      <div style={styles.subformContainer}>
                        <div style={styles.subformLabel}>
                          Elige 2 atributos distintos ({selectedTraits.length}/2 seleccionados):
                        </div>
                        <div style={styles.traitsGrid}>
                          {TRAIT_KEYS.map((t) => {
                            const isMarked = markedTraits.has(t.key.toLowerCase());
                            const isTraitChecked = selectedTraits.includes(t.key);
                            const currentVal = character?.atributos?.[t.key] ?? 0;
                            return (
                              <button
                                key={t.key}
                                type="button"
                                onClick={() => toggleTrait(t.key)}
                                disabled={isMarked || (!isTraitChecked && selectedTraits.length >= 2)}
                                style={{
                                  ...styles.traitChip,
                                  ...(isTraitChecked ? styles.traitChipSelected : {}),
                                  ...(isMarked ? styles.traitChipDisabled : {}),
                                }}
                              >
                                <span>{t.icon} {t.label}</span>
                                <strong>
                                  {currentVal >= 0 ? `+${currentVal}` : currentVal}
                                  {isTraitChecked ? ' → ' + (currentVal + 1) : ''}
                                </strong>
                                {isMarked && <small style={styles.markedNotice}>🔒 Tier</small>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 2. +1 RANURA HP */}
              {(() => {
                const isLocked = hpCount >= 2;
                const isSelected = selectedOptionTypes.includes('GAIN_HP');
                return (
                  <div
                    style={{
                      ...styles.optionCard,
                      ...(isSelected ? styles.optionCardActive : {}),
                      ...(isLocked ? styles.optionCardLocked : {}),
                    }}
                  >
                    <div style={styles.optionCardHeader}>
                      <div>
                        <strong style={styles.optionTitle}>2. +1 Ranura de HP</strong>
                        <div style={styles.optionLimit}>
                          Máx 2 en este Tier ({hpCount}/2 usados)
                        </div>
                      </div>
                      {isLocked ? (
                        <span style={styles.lockBadge}>🔒 Límite</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleOptionType('GAIN_HP', isLocked)}
                          style={isSelected ? styles.btnOptionSelected : styles.btnOptionPick}
                          disabled={isLocked || (!isSelected && selectedOptionTypes.length >= 2)}
                        >
                          {isSelected ? '✓ Elegida' : '+ Seleccionar'}
                        </button>
                      )}
                    </div>
                    <p style={styles.optionDesc}>
                      Aumenta tus puntos de golpe máximos en +1 permanentemente.
                    </p>
                    {isSelected && (
                      <div style={styles.subformContainer}>
                        <span style={styles.statPreview}>
                          ❤️ Puntos de Golpe: <strong>{character?.hpMax}</strong> →{' '}
                          <strong style={{ color: '#2ecc71' }}>{(character?.hpMax || 0) + 1}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 3. +1 RANURA ESTRÉS */}
              {(() => {
                const isLocked = stressCount >= 2;
                const isSelected = selectedOptionTypes.includes('GAIN_STRESS');
                return (
                  <div
                    style={{
                      ...styles.optionCard,
                      ...(isSelected ? styles.optionCardActive : {}),
                      ...(isLocked ? styles.optionCardLocked : {}),
                    }}
                  >
                    <div style={styles.optionCardHeader}>
                      <div>
                        <strong style={styles.optionTitle}>3. +1 Ranura de Estrés</strong>
                        <div style={styles.optionLimit}>
                          Máx 2 en este Tier ({stressCount}/2 usados)
                        </div>
                      </div>
                      {isLocked ? (
                        <span style={styles.lockBadge}>🔒 Límite</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleOptionType('GAIN_STRESS', isLocked)}
                          style={isSelected ? styles.btnOptionSelected : styles.btnOptionPick}
                          disabled={isLocked || (!isSelected && selectedOptionTypes.length >= 2)}
                        >
                          {isSelected ? '✓ Elegida' : '+ Seleccionar'}
                        </button>
                      )}
                    </div>
                    <p style={styles.optionDesc}>
                      Aumenta tu capacidad máxima de estrés en +1 para resistir presiones y costes mágicos.
                    </p>
                    {isSelected && (
                      <div style={styles.subformContainer}>
                        <span style={styles.statPreview}>
                          😰 Estrés Máximo: <strong>{character?.estresMax}</strong> →{' '}
                          <strong style={{ color: '#e67e22' }}>{(character?.estresMax || 0) + 1}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 4. MEJORAR EXPERIENCIAS */}
              {(() => {
                const isLocked = experiencesCount >= 1;
                const isSelected = selectedOptionTypes.includes('INCREASE_EXPERIENCES');
                return (
                  <div
                    style={{
                      ...styles.optionCard,
                      ...(isSelected ? styles.optionCardActive : {}),
                      ...(isLocked ? styles.optionCardLocked : {}),
                    }}
                  >
                    <div style={styles.optionCardHeader}>
                      <div>
                        <strong style={styles.optionTitle}>4. Mejorar Experiencias</strong>
                        <div style={styles.optionLimit}>
                          Máx 1 en este Tier ({experiencesCount}/1 usado)
                        </div>
                      </div>
                      {isLocked ? (
                        <span style={styles.lockBadge}>🔒 Límite</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleOptionType('INCREASE_EXPERIENCES', isLocked)}
                          style={isSelected ? styles.btnOptionSelected : styles.btnOptionPick}
                          disabled={isLocked || (!isSelected && selectedOptionTypes.length >= 2)}
                        >
                          {isSelected ? '✓ Elegida' : '+ Seleccionar'}
                        </button>
                      )}
                    </div>
                    <p style={styles.optionDesc}>
                      Selecciona 2 de tus experiencias existentes para incrementar su bonificador en +1.
                    </p>
                    {isSelected && (
                      <div style={styles.subformContainer}>
                        <div style={styles.subformLabel}>
                          Elige 2 experiencias ({selectedExpNames.length}/2):
                        </div>
                        {existingExps.length === 0 ? (
                          <span style={styles.warningNote}>
                            No tienes experiencias registradas aún para mejorar.
                          </span>
                        ) : (
                          <div style={styles.expList}>
                            {existingExps.map((exp, idx) => {
                              const isChecked = selectedExpNames.includes(exp.nombre);
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => toggleExperience(exp.nombre)}
                                  disabled={!isChecked && selectedExpNames.length >= 2}
                                  style={{
                                    ...styles.expItem,
                                    ...(isChecked ? styles.expItemSelected : {}),
                                  }}
                                >
                                  <span>📜 {exp.nombre}</span>
                                  <strong>
                                    +{exp.valor} {isChecked ? `→ +${exp.valor + 1}` : ''}
                                  </strong>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 5. CARTA DE DOMINIO EXTRA */}
              {(() => {
                const isLocked = extraCardsCount >= 1;
                const isSelected = selectedOptionTypes.includes('EXTRA_DOMAIN_CARD');
                return (
                  <div
                    style={{
                      ...styles.optionCard,
                      ...(isSelected ? styles.optionCardActive : {}),
                      ...(isLocked ? styles.optionCardLocked : {}),
                    }}
                  >
                    <div style={styles.optionCardHeader}>
                      <div>
                        <strong style={styles.optionTitle}>5. Carta de Dominio Extra</strong>
                        <div style={styles.optionLimit}>
                          Máx 1 en este Tier ({extraCardsCount}/1 usado)
                        </div>
                      </div>
                      {isLocked ? (
                        <span style={styles.lockBadge}>🔒 Límite</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleOptionType('EXTRA_DOMAIN_CARD', isLocked)}
                          style={isSelected ? styles.btnOptionSelected : styles.btnOptionPick}
                          disabled={isLocked || (!isSelected && selectedOptionTypes.length >= 2)}
                        >
                          {isSelected ? '✓ Elegida' : '+ Seleccionar'}
                        </button>
                      )}
                    </div>
                    <p style={styles.optionDesc}>
                      Añade 1 carta de dominio adicional (Nivel ≤ {targetLevel}) a tus cartas activas.
                    </p>
                    {isSelected && (
                      <div style={styles.subformContainer}>
                        <div style={styles.subformLabel}>
                          Elige 1 carta de dominio adicional:
                        </div>
                        <select
                          value={extraCardId || ''}
                          onChange={(e) => setExtraCardId(e.target.value ? Number(e.target.value) : null)}
                          style={styles.selectInput}
                        >
                          <option value="">-- Selecciona una habilidad secundaria --</option>
                          {secondaryDomainCards.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.titulo} (Nv. {c.nivel || 1})
                            </option>
                          ))}
                        </select>
                        {extraCardId && (
                          <button
                            type="button"
                            onClick={() => {
                              const chosen = secondaryDomainCards.find((c) => c.id === extraCardId);
                              if (chosen) setInspectedCard(chosen);
                            }}
                            style={styles.btnInspectSecondary}
                            title="Ver detalles completos de la carta seleccionada"
                          >
                            👁️ Ver completa
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 6. +1 A EVASIÓN */}
              {(() => {
                const isLocked = evasionCount >= 1;
                const isSelected = selectedOptionTypes.includes('INCREASE_EVASION');
                return (
                  <div
                    style={{
                      ...styles.optionCard,
                      ...(isSelected ? styles.optionCardActive : {}),
                      ...(isLocked ? styles.optionCardLocked : {}),
                    }}
                  >
                    <div style={styles.optionCardHeader}>
                      <div>
                        <strong style={styles.optionTitle}>6. +1 a Evasión</strong>
                        <div style={styles.optionLimit}>
                          Máx 1 en este Tier ({evasionCount}/1 usado)
                        </div>
                      </div>
                      {isLocked ? (
                        <span style={styles.lockBadge}>🔒 Límite</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleOptionType('INCREASE_EVASION', isLocked)}
                          style={isSelected ? styles.btnOptionSelected : styles.btnOptionPick}
                          disabled={isLocked || (!isSelected && selectedOptionTypes.length >= 2)}
                        >
                          {isSelected ? '✓ Elegida' : '+ Seleccionar'}
                        </button>
                      )}
                    </div>
                    <p style={styles.optionDesc}>
                      Incrementa permanentemente tu dificultad para ser impactado en combate en +1.
                    </p>
                    {isSelected && (
                      <div style={styles.subformContainer}>
                        <span style={styles.statPreview}>
                          🛡️ Evasión: <strong>{character?.evasion ?? 10}</strong> →{' '}
                          <strong style={{ color: '#f1c40f' }}>{(character?.evasion ?? 10) + 1}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* PIE DE ACCIONES */}
        <div style={styles.footer}>
          <div style={styles.footerStatus}>
            <span style={isStep1Valid ? styles.reqMet : styles.reqMissing}>
              {isStep1Valid ? '✓' : '•'} Paso 1: Carta obligatoria {isTierMilestone ? '+ Experiencia' : ''}
            </span>
            <span style={isStep2Valid ? styles.reqMet : styles.reqMissing}>
              {isStep2Valid ? '✓' : '•'} Paso 2: 2 Opciones del Tier seleccionadas ({selectedOptionTypes.length}/2)
            </span>
          </div>

          <div style={styles.footerButtons}>
            <button type="button" onClick={onClose} style={styles.btnCancel} disabled={saving}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={canSubmit ? styles.btnSubmitActive : styles.btnSubmitDisabled}
            >
              {saving ? '⏳ Subiendo de Nivel...' : `⚡ Confirmar Nivel ${targetLevel}`}
            </button>
          </div>
        </div>

        {/* Panel Lateral Desplegable (CardInspectorDrawer - Sprint 22.5) */}
        {inspectedCard && (
          <CardInspectorDrawer
            card={inspectedCard}
            onClose={() => setInspectedCard(null)}
            onSelect={(card) => {
              const isAlreadyActive = character?.cartasActivasIds?.includes(card.id);
              if (!isAlreadyActive) {
                setMandatoryCardId(card.id);
              }
              setInspectedCard(null);
            }}
            isSelected={mandatoryCardId === inspectedCard.id}
            isAlreadyActive={character?.cartasActivasIds?.includes(inspectedCard.id)}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estilos Dark Fantasy
// ---------------------------------------------------------------------------
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 3, 2, 0.85)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#150f07',
    border: '2px solid #5a3d24',
    boxShadow: '0 0 35px rgba(0, 0, 0, 0.9), 0 0 15px rgba(212, 175, 55, 0.2)',
    borderRadius: '10px',
    width: '100%',
    maxWidth: '920px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    color: '#e0d0b8',
    fontFamily: '"Cinzel", "Georgia", serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 24px',
    backgroundColor: '#1e140a',
    borderBottom: '1px solid #3d2a1b',
  },
  tierTag: {
    display: 'inline-block',
    fontSize: '0.68rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#ffea75',
    backgroundColor: '#3d2a1b',
    padding: '2px 8px',
    borderRadius: '4px',
    marginBottom: '4px',
  },
  title: {
    margin: 0,
    fontSize: '1.35rem',
    color: '#d4af37',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '0.82rem',
    color: '#a08b77',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#8c7662',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'color 0.2s',
  },
  scrollBody: {
    padding: '20px 24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionBox: {
    backgroundColor: '#1b1208',
    border: '1px solid #3d2a1b',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #2e1f0e',
    paddingBottom: '8px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.05rem',
    color: '#f0dfc8',
  },
  sectionSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '0.78rem',
    color: '#9c8774',
  },
  badgeDone: {
    fontSize: '0.72rem',
    color: '#2ecc71',
    backgroundColor: '#0e2b18',
    border: '1px solid #1b5e20',
    padding: '3px 8px',
    borderRadius: '12px',
    fontWeight: 'bold',
  },
  badgePending: {
    fontSize: '0.72rem',
    color: '#e67e22',
    backgroundColor: '#2e1c0c',
    border: '1px solid #7d4411',
    padding: '3px 8px',
    borderRadius: '12px',
    fontWeight: 'bold',
  },
  milestoneNotice: {
    display: 'flex',
    gap: '14px',
    backgroundColor: '#281a0b',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '12px 14px',
  },
  milestoneIcon: {
    fontSize: '2rem',
  },
  milestoneContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  milestoneTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  milestoneTitle: {
    color: '#ffea75',
    fontSize: '0.92rem',
  },
  proficiencyBadge: {
    backgroundColor: '#3d2a1b',
    color: '#ffd700',
    fontSize: '0.75rem',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: 'bold',
    border: '1px solid #ffd700',
  },
  milestoneDesc: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#d4c2a5',
    lineHeight: '1.3',
  },
  newExpInputRow: {
    marginTop: '6px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '0.82rem',
    color: '#e0d0b8',
    fontWeight: 'bold',
  },
  hint: {
    fontSize: '0.72rem',
    color: '#9c8774',
    fontWeight: 'normal',
  },
  textInput: {
    backgroundColor: '#120b04',
    border: '1px solid #5a3d24',
    borderRadius: '4px',
    padding: '7px 10px',
    color: '#ffea75',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  cardSelectionSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cardSelectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  searchInput: {
    backgroundColor: '#120b04',
    border: '1px solid #3d2a1b',
    borderRadius: '4px',
    padding: '5px 10px',
    color: '#e0d0b8',
    fontSize: '0.78rem',
    fontFamily: 'inherit',
    minWidth: '180px',
    outline: 'none',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '10px',
    maxHeight: '220px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  cardItem: {
    backgroundColor: '#150d06',
    border: '1px solid #3d2a1b',
    borderRadius: '6px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  cardItemSelected: {
    borderColor: '#ffd700',
    backgroundColor: '#281a0b',
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.25)',
  },
  cardItemDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    borderColor: '#241a10',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTypeTag: {
    fontSize: '0.62rem',
    backgroundColor: '#2e1f0e',
    color: '#d4af37',
    padding: '1px 5px',
    borderRadius: '3px',
    textTransform: 'uppercase',
  },
  cardLevelTag: {
    fontSize: '0.62rem',
    color: '#a08b77',
  },
  cardTitle: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#ffea75',
  },
  cardDesc: {
    margin: 0,
    fontSize: '0.72rem',
    color: '#b09d89',
    lineHeight: '1.25',
    flex: 1,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
  cardBottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
    gap: '6px',
  },
  btnInspectCard: {
    background: 'none',
    border: 'none',
    color: '#ffc83b',
    fontSize: '0.68rem',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '3px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  btnInspectSecondary: {
    marginTop: '6px',
    background: 'none',
    border: 'none',
    color: '#ffc83b',
    fontSize: '0.72rem',
    cursor: 'pointer',
    padding: '2px 4px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'inherit',
    textDecoration: 'underline',
  },
  selectedTag: {
    fontSize: '0.68rem',
    color: '#ffd700',
    fontWeight: 'bold',
  },
  alreadyActiveTag: {
    fontSize: '0.65rem',
    color: '#7a6a5a',
    fontStyle: 'italic',
  },
  selectBtnPlaceholder: {
    fontSize: '0.68rem',
    color: '#8c7b6d',
  },
  statusBox: {
    padding: '16px',
    textAlign: 'center',
    color: '#8c7b6d',
    fontSize: '0.85rem',
    fontStyle: 'italic',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '12px',
  },
  optionCard: {
    backgroundColor: '#150d06',
    border: '1px solid #3d2a1b',
    borderRadius: '6px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  optionCardActive: {
    borderColor: '#d4af37',
    backgroundColor: '#24170a',
    boxShadow: '0 0 10px rgba(212, 175, 55, 0.2)',
  },
  optionCardLocked: {
    opacity: 0.55,
    backgroundColor: '#110a04',
    borderColor: '#26190f',
  },
  optionCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: '0.9rem',
    color: '#f0dfc8',
  },
  optionLimit: {
    fontSize: '0.7rem',
    color: '#9c8774',
  },
  lockBadge: {
    fontSize: '0.68rem',
    color: '#7a5a4a',
    backgroundColor: '#1a1008',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #3d2a1b',
  },
  btnOptionPick: {
    backgroundColor: '#2e1f0e',
    color: '#d4af37',
    border: '1px solid #5a3d24',
    borderRadius: '4px',
    padding: '3px 9px',
    fontSize: '0.72rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 'bold',
  },
  btnOptionSelected: {
    backgroundColor: '#3d2a0d',
    color: '#ffd700',
    border: '1px solid #ffd700',
    borderRadius: '4px',
    padding: '3px 9px',
    fontSize: '0.72rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 'bold',
  },
  optionDesc: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#a8947f',
    lineHeight: '1.3',
  },
  subformContainer: {
    marginTop: '6px',
    paddingTop: '8px',
    borderTop: '1px dashed #3d2a1b',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  subformLabel: {
    fontSize: '0.74rem',
    color: '#ffea75',
    fontWeight: 'bold',
  },
  traitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  },
  traitChip: {
    backgroundColor: '#1c1208',
    border: '1px solid #3d2a1b',
    borderRadius: '4px',
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    cursor: 'pointer',
    color: '#d4c2a5',
    fontSize: '0.72rem',
    fontFamily: 'inherit',
    position: 'relative',
  },
  traitChipSelected: {
    borderColor: '#ffd700',
    backgroundColor: '#38250f',
    color: '#ffea75',
  },
  traitChipDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    borderColor: '#241a10',
  },
  markedNotice: {
    fontSize: '0.58rem',
    color: '#e74c3c',
    marginTop: '1px',
  },
  statPreview: {
    fontSize: '0.8rem',
    color: '#e0d0b8',
  },
  expList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  expItem: {
    backgroundColor: '#1c1208',
    border: '1px solid #3d2a1b',
    borderRadius: '4px',
    padding: '5px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#d4c2a5',
    fontSize: '0.74rem',
    fontFamily: 'inherit',
  },
  expItemSelected: {
    borderColor: '#ffd700',
    backgroundColor: '#38250f',
    color: '#ffea75',
  },
  warningNote: {
    fontSize: '0.72rem',
    color: '#e67e22',
    fontStyle: 'italic',
  },
  selectInput: {
    backgroundColor: '#120b04',
    border: '1px solid #5a3d24',
    borderRadius: '4px',
    padding: '6px 8px',
    color: '#ffea75',
    fontSize: '0.78rem',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 24px',
    backgroundColor: '#1e140a',
    borderTop: '1px solid #3d2a1b',
    flexWrap: 'wrap',
    gap: '12px',
  },
  footerStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  reqMet: {
    fontSize: '0.72rem',
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  reqMissing: {
    fontSize: '0.72rem',
    color: '#e74c3c',
  },
  footerButtons: {
    display: 'flex',
    gap: '10px',
  },
  btnCancel: {
    backgroundColor: '#1b1208',
    color: '#8c7b6d',
    border: '1px solid #3d2a1b',
    borderRadius: '5px',
    padding: '8px 16px',
    fontSize: '0.82rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSubmitActive: {
    backgroundColor: '#d4af37',
    color: '#150f07',
    border: '1px solid #ffd700',
    borderRadius: '5px',
    padding: '8px 18px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 0 12px rgba(255, 215, 0, 0.4)',
    transition: 'all 0.2s ease',
  },
  btnSubmitDisabled: {
    backgroundColor: '#261c12',
    color: '#6e5d4d',
    border: '1px solid #3d2a1b',
    borderRadius: '5px',
    padding: '8px 18px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
  alertError: {
    backgroundColor: '#3d1212',
    color: '#ff9999',
    borderBottom: '1px solid #8b1a1a',
    padding: '8px 24px',
    fontSize: '0.8rem',
  },
  alertSuccess: {
    backgroundColor: '#123d1d',
    color: '#99ffb2',
    borderBottom: '1px solid #1a8b32',
    padding: '8px 24px',
    fontSize: '0.8rem',
  },
};
