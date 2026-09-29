import React, { useState, useEffect } from 'react';
import MarkdownText from './MarkdownText';

const STANDARD_ARRAY = [2, 1, 1, 0, 0, -1];
const ATTRIBUTES = [
  { key: 'agilidad', label: 'Agilidad (AGI)', desc: 'Esquivar, moverse con sigilo, puntería rápida.' },
  { key: 'fuerza', label: 'Fuerza (FUE)', desc: 'Poder físico, resistir daño, combate cuerpo a cuerpo.' },
  { key: 'sutileza', label: 'Sutileza (SUT)', desc: 'Juego de manos, acrobacias, trampas, sutileza.' },
  { key: 'instinto', label: 'Instinto (INS)', desc: 'Percepción, reflejos, conexión con la naturaleza.' },
  { key: 'presencia', label: 'Presencia (PRE)', desc: 'Carisma, liderazgo, intimidación y persuasión.' },
  { key: 'conocimiento', label: 'Conocimiento (CON)', desc: 'Historia, magia arcana, medicina e investigación.' },
];

/**
 * CharacterCreator: Wizard guiado para crear nuevos personajes de Nivel 1 (Sprint 12).
 *
 * Pasos:
 *  1. Orígenes: Nombre, Clase, Subclase, Linaje, Comunidad (lee metadata de Clase).
 *  2. Rasgos: Asignación de la matriz estándar (+2, +1, +1, +0, +0, -1).
 *  3. Experiencias Iniciales: 2 experiencias con valor fijo +2.
 *  4. Equipamiento Inicial: Selección estricta de 1 armadura, 2 armas y hasta 10 consumibles/ítems.
 *     Auto-equipado inteligente evaluando la carga (burdens).
 */
export default function CharacterCreator({ onComplete, onCancel }) {
  const [step, setStep] = useState(1); // 1, 2, 3, 4
  const [cards, setCards] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // --- Datos del Paso 1: Orígenes ---
  const [nombre, setNombre] = useState('');
  const [selectedClaseId, setSelectedClaseId] = useState('');
  const [selectedSubclaseId, setSelectedSubclaseId] = useState('');
  const [selectedLinajeId, setSelectedLinajeId] = useState('');
  const [selectedComunidadId, setSelectedComunidadId] = useState('');

  // Metadatos derivados de la clase
  const [claseMetadata, setClaseMetadata] = useState({
    evasion_base: 10,
    hp_inicial: 6,
    dominios: ['Arcano', 'Medianoche'],
  });

  // --- Datos del Paso 2: Atributos ---
  const [atributos, setAtributos] = useState({
    agilidad: 2,
    fuerza: 1,
    sutileza: 1,
    instinto: 0,
    presencia: 0,
    conocimiento: -1,
  });

  // --- Datos del Paso 3: Experiencias ---
  const [exp1, setExp1] = useState('');
  const [exp2, setExp2] = useState('');

  // --- Datos del Paso 4: Equipamiento Inicial ---
  const [selectedArmor, setSelectedArmor] = useState(null);
  const [selectedWeapons, setSelectedWeapons] = useState([]); // Array de exactamente 2 armas
  const [selectedItems, setSelectedItems] = useState([]); // Array de hasta 10 consumibles/objetos

  // Carga de catálogo de cartas e ítems para el wizard
  useEffect(() => {
    // 1. Cartas
    fetch('/api/cards')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setCards(data);
        setLoadingCards(false);

        const linajes = data.filter((c) => c.tipo === 'Linaje' || c.tipo === 'Ancestro');
        const comunidades = data.filter((c) => c.tipo === 'Comunidad');

        if (linajes.length > 0) setSelectedLinajeId(linajes[0].id);
        if (comunidades.length > 0) setSelectedComunidadId(comunidades[0].id);

        setSelectedClaseId('');
        setSelectedSubclaseId('');
      })
      .catch((err) => {
        console.error('[CharacterCreator] Error cargando cartas:', err);
        setLoadingCards(false);
      });

    // 2. Ítems
    fetch('/api/items')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setItems(data);
        setLoadingItems(false);
      })
      .catch((err) => {
        console.error('[CharacterCreator] Error cargando ítems:', err);
        setLoadingItems(false);
      });
  }, []);

  function handleClaseChange(id, cardList = cards) {
    setSelectedClaseId(id);
    if (!id) {
      setSelectedSubclaseId('');
      return;
    }

    const claseCard = cardList.find((c) => c.id === parseInt(id, 10));
    if (claseCard?.metadata) {
      try {
        const meta = typeof claseCard.metadata === 'string' ? JSON.parse(claseCard.metadata) : (claseCard.metadata || {});
        setClaseMetadata({
          evasion_base: meta.evasion_base || 10,
          hp_inicial: meta.hp_inicial || 6,
          dominios: meta.dominios || ['Arcano', 'Medianoche'],
        });
      } catch (e) {
        console.warn('Error al parsear metadata de clase:', e);
      }
    }

    // Filtrar subclases válidas cuyo metadata.clase_padre coincida con la Clase seleccionada
    const validSubclases = cardList.filter((c) => {
      if (c.tipo !== 'Subclase') return false;
      try {
        const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata) : (c.metadata || {});
        return (
          meta?.clase_padre &&
          meta.clase_padre.trim().toLowerCase() === claseCard?.titulo?.trim().toLowerCase()
        );
      } catch {
        return false;
      }
    });

    if (validSubclases.length > 0) {
      setSelectedSubclaseId(validSubclases[0].id);
    } else {
      setSelectedSubclaseId('');
    }
  }

  // Validación de la matriz estándar del Paso 2
  function validateStandardArray() {
    const values = Object.values(atributos).sort((a, b) => b - a);
    const expected = [...STANDARD_ARRAY].sort((a, b) => b - a);
    return JSON.stringify(values) === JSON.stringify(expected);
  }

  // Gestión de selección de armas en Paso 4 (exactamente 2)
  function toggleWeaponSelection(weapon) {
    setSelectedWeapons((prev) => {
      const exists = prev.some((w) => w.id === weapon.id);
      if (exists) {
        return prev.filter((w) => w.id !== weapon.id);
      } else {
        if (prev.length >= 2) return prev;
        return [...prev, weapon];
      }
    });
  }

  // Gestión de selección de inventario rápido en Paso 4 (hasta 10)
  function addInventoryItem(item) {
    setSelectedItems((prev) => {
      if (prev.length >= 10) return prev;
      return [...prev, item];
    });
  }

  function removeInventoryItem(indexToRemove) {
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  // Guardado Final: POST /api/characters con Auto-Equipado Inteligente
  function handleFinalSubmit(e) {
    if (e) e.preventDefault();

    if (!nombre.trim() || !exp1.trim() || !exp2.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos de orígenes y experiencias.');
      return;
    }

    if (!selectedArmor) {
      setErrorMsg('Debes seleccionar exactamente 1 armadura para comenzar tu aventura.');
      return;
    }

    if (selectedWeapons.length !== 2) {
      setErrorMsg('Debes seleccionar exactamente 2 armas para tu personaje.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const claseCard = cards.find((c) => c.id === parseInt(selectedClaseId, 10));
    const subclaseCard = cards.find((c) => c.id === parseInt(selectedSubclaseId, 10));
    const linajeCard = cards.find((c) => c.id === parseInt(selectedLinajeId, 10));
    const comunidadCard = cards.find((c) => c.id === parseInt(selectedComunidadId, 10));

    const foundationCardIds = [
      claseCard?.id,
      subclaseCard?.id,
      linajeCard?.id,
      comunidadCard?.id,
    ].filter(Boolean);

    // =========================================================================
    // LÓGICA DE AUTO-EQUIPADO INICIAL (Fase 3)
    // =========================================================================
    const weapon1 = selectedWeapons[0];
    const weapon2 = selectedWeapons[1];

    let armaPrincipal = weapon1;
    let armaSecundaria = null;
    const finalInventory = [...selectedItems];

    if (weapon1.carga === 2) {
      // Si la primera arma tiene carga: 2, la segunda arma va directamente al inventario (sin manos libres)
      finalInventory.push(weapon2);
    } else {
      // Primera arma tiene carga: 1
      if (weapon2.carga === 1) {
        armaSecundaria = weapon2;
      } else {
        // La segunda arma tiene carga 2, no cabe en la mano secundaria: va al inventario
        finalInventory.push(weapon2);
      }
    }

    const armaduraActiva = selectedArmor;

    const newHero = {
      nombre: nombre.trim(),
      nivel: 1,
      competencia: 1,
      clase: claseCard?.titulo || 'Aventurero',
      subclase: subclaseCard?.titulo || '',
      ancestro: linajeCard?.titulo || 'Humano',
      comunidad: comunidadCard?.titulo || 'Cosmopolita',
      hpActual: claseMetadata.hp_inicial,
      hpMax: claseMetadata.hp_inicial,
      estresActual: 0,
      estresMax: 6,
      esperanzaActual: 2,
      esperanzaMax: 5,
      evasion: claseMetadata.evasion_base,
      ranurasArmaduraMarcadas: 0,
      atributos: {
        agilidad: parseInt(atributos.agilidad, 10),
        fuerza: parseInt(atributos.fuerza, 10),
        sutileza: parseInt(atributos.sutileza, 10),
        instinto: parseInt(atributos.instinto, 10),
        presencia: parseInt(atributos.presencia, 10),
        conocimiento: parseInt(atributos.conocimiento, 10),
      },
      oro: { punados: 0, sacos: 0, cofres: 0 },
      experiencias: [
        { nombre: exp1.trim(), valor: 2 },
        { nombre: exp2.trim(), valor: 2 },
      ],
      cartasActivasIds: foundationCardIds,
      armaPrincipal: armaPrincipal,
      armaSecundaria: armaSecundaria,
      armaduraActiva: armaduraActiva,
      inventario: finalInventory,
    };

    fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHero),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((savedChar) => {
        setIsSaving(false);
        if (onComplete) onComplete(savedChar);
      })
      .catch((err) => {
        console.error('[CharacterCreator] Error al guardar héroe:', err);
        setErrorMsg(`Error al guardar: ${err.message}`);
        setIsSaving(false);
      });
  }

  // Filtrado de cartas por tipo
  const clasesDisponibles = cards.filter((c) => c.tipo === 'Clase');
  const linajesDisponibles = cards.filter((c) => c.tipo === 'Linaje' || c.tipo === 'Ancestro');
  const comunidadesDisponibles = cards.filter((c) => c.tipo === 'Comunidad');

  // Filtrado estricto de subclases según la clase seleccionada
  const selectedClaseCard = cards.find((c) => c.id === parseInt(selectedClaseId, 10));
  const subclasesDisponibles = cards.filter((c) => {
    if (c.tipo !== 'Subclase') return false;
    if (!selectedClaseCard) return false;
    try {
      const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata) : (c.metadata || {});
      return (
        meta?.clase_padre &&
        meta.clase_padre.trim().toLowerCase() === selectedClaseCard.titulo.trim().toLowerCase()
      );
    } catch {
      return false;
    }
  });

  // Filtrado de ítems para el Paso 4 (Sprint 12)
  const armasTier1 = items.filter((it) => it.tipo === 'Arma' && it.tier === 1);
  const armadurasTier1 = items.filter((it) => it.tipo === 'Armadura' && it.tier === 1);
  const consumiblesDisponibles = items.filter((it) => it.tipo === 'Consumible' || it.tier === 1);

  return (
    <div style={styles.container}>
      {/* Barra de Progreso del Wizard */}
      <div style={styles.wizardHeader}>
        <div>
          <h2 style={styles.wizardTitle}>Forja de Héroe (Nivel 1)</h2>
          <p style={styles.wizardSubtitle}>Crea a tu personaje siguiendo las reglas fundacionales de Daggerheart.</p>
        </div>
        <button onClick={onCancel} style={styles.btnCancelTop}>
          ✕ Cancelar
        </button>
      </div>

      <div style={styles.stepsBar}>
        <div style={step === 1 ? styles.stepBadgeActive : styles.stepBadge}>
          1. Orígenes
        </div>
        <div style={step === 2 ? styles.stepBadgeActive : styles.stepBadge}>
          2. Atributos
        </div>
        <div style={step === 3 ? styles.stepBadgeActive : styles.stepBadge}>
          3. Experiencias
        </div>
        <div style={step === 4 ? styles.stepBadgeActive : styles.stepBadge}>
          4. Equipamiento Inicial
        </div>
      </div>

      {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

      {/* =================================================================== */}
      {/* PASO 1: ORÍGENES Y CARTAS FUNDACIONALES                             */}
      {/* =================================================================== */}
      {step === 1 && (
        <div style={styles.stepContent}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre del Héroe:</label>
            <input
              type="text"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Eryndor, Kaelen, Lyra..."
              style={styles.inputLarge}
            />
          </div>

          <div style={styles.selectorsGrid}>
            {/* Clase */}
            <div style={styles.selectorCard}>
              <label style={styles.label}>1. Clase:</label>
              <select
                value={selectedClaseId}
                onChange={(e) => handleClaseChange(e.target.value)}
                style={styles.select}
              >
                <option value="">-- Selecciona una Clase --</option>
                {clasesDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.titulo}</option>
                ))}
              </select>
              {selectedClaseId && (
                <div style={styles.cardPreview}>
                  <div style={styles.metaPreviewRow}>
                    <span>Evasión Base: <strong>{claseMetadata.evasion_base}</strong></span>
                    <span>HP Máximo: <strong>{claseMetadata.hp_inicial}</strong></span>
                  </div>
                  <div style={styles.domainsRow}>
                    Dominios: {claseMetadata.dominios.join(' · ')}
                  </div>
                </div>
              )}
            </div>

            {/* Subclase */}
            <div style={styles.selectorCard}>
              <label style={styles.label}>
                2. Subclase:
                {!selectedClaseId && <span style={styles.disabledHint}>(Elige una Clase primero)</span>}
              </label>
              <select
                value={selectedSubclaseId}
                onChange={(e) => setSelectedSubclaseId(e.target.value)}
                disabled={!selectedClaseId}
                style={{
                  ...styles.select,
                  ...(!selectedClaseId ? styles.selectDisabled : {}),
                }}
              >
                {!selectedClaseId ? (
                  <option value="">-- Elige una Clase primero --</option>
                ) : subclasesDisponibles.length === 0 ? (
                  <option value="">-- No hay subclases para {selectedClaseCard?.titulo} --</option>
                ) : (
                  <>
                    <option value="">-- Selecciona una Subclase --</option>
                    {subclasesDisponibles.map((c) => (
                      <option key={c.id} value={c.id}>{c.titulo}</option>
                    ))}
                  </>
                )}
              </select>
              {selectedSubclaseId && (
                <div style={{ ...styles.cardPreview, marginTop: '8px' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#c8b898' }}>
                    {subclasesDisponibles.find((c) => c.id === parseInt(selectedSubclaseId, 10))?.descripcion}
                  </p>
                </div>
              )}
            </div>

            {/* Linaje */}
            <div style={styles.selectorCard}>
              <label style={styles.label}>3. Linaje:</label>
              <select
                value={selectedLinajeId}
                onChange={(e) => setSelectedLinajeId(e.target.value)}
                style={styles.select}
              >
                {linajesDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.titulo}</option>
                ))}
              </select>
            </div>

            {/* Comunidad */}
            <div style={styles.selectorCard}>
              <label style={styles.label}>4. Comunidad:</label>
              <select
                value={selectedComunidadId}
                onChange={(e) => setSelectedComunidadId(e.target.value)}
                style={styles.select}
              >
                {comunidadesDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.navRow}>
            <span style={styles.hint}>Las 4 cartas elegidas se añadirán como tus cartas activas iniciales.</span>
            <button
              onClick={() => {
                if (!nombre.trim()) {
                  setErrorMsg('Ingresa un nombre para tu héroe.');
                  return;
                }
                if (!selectedClaseId) {
                  setErrorMsg('Debes elegir una Clase para tu héroe.');
                  return;
                }
                if (!selectedSubclaseId) {
                  setErrorMsg('Debes elegir una Subclase válida para continuar.');
                  return;
                }
                setErrorMsg(null);
                setStep(2);
              }}
              style={styles.btnNext}
            >
              Siguiente: Asignar Rasgos ➔
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PASO 2: MATRIZ DE ATRIBUTOS (+2, +1, +1, +0, +0, -1)                */}
      {/* =================================================================== */}
      {step === 2 && (
        <div style={styles.stepContent}>
          <div style={styles.stepIntro}>
            <h4 style={styles.stepSubtitle}>Asigna la Matriz Estándar</h4>
            <p style={styles.stepDesc}>
              En Daggerheart, cada héroe reparte exactamente estos 6 modificadores entre sus 6 rasgos:
              <strong style={{ color: '#d4af37' }}> +2, +1, +1, +0, +0, -1</strong>.
            </p>
          </div>

          <div style={styles.attributesGrid}>
            {ATTRIBUTES.map((attr) => (
              <div key={attr.key} style={styles.attrCard}>
                <div style={styles.attrInfo}>
                  <strong style={styles.attrName}>{attr.label}</strong>
                  <span style={styles.attrDesc}>{attr.desc}</span>
                </div>
                <select
                  value={atributos[attr.key]}
                  onChange={(e) =>
                    setAtributos((prev) => ({
                      ...prev,
                      [attr.key]: parseInt(e.target.value, 10),
                    }))
                  }
                  style={styles.attrSelect}
                >
                  <option value={2}>+2</option>
                  <option value={1}>+1</option>
                  <option value={0}>+0</option>
                  <option value={-1}>-1</option>
                </select>
              </div>
            ))}
          </div>

          {!validateStandardArray() && (
            <div style={styles.warningBox}>
              ⚠️ La combinación actual no coincide exactamente con (+2, +1, +1, +0, +0, -1). Ajusta los valores para continuar.
            </div>
          )}

          <div style={styles.navRow}>
            <button onClick={() => setStep(1)} style={styles.btnBack}>
              ⬅ Volver a Orígenes
            </button>
            <button
              disabled={!validateStandardArray()}
              onClick={() => {
                setErrorMsg(null);
                setStep(3);
              }}
              style={validateStandardArray() ? styles.btnNext : styles.btnDisabled}
            >
              Siguiente: Experiencias ➔
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PASO 3: EXPERIENCIAS INICIALES (+2 CADA UNA)                        */}
      {/* =================================================================== */}
      {step === 3 && (
        <div style={styles.stepContent}>
          <div style={styles.stepIntro}>
            <h4 style={styles.stepSubtitle}>Experiencias Fundacionales (Nivel 1)</h4>
            <p style={styles.stepDesc}>
              Define dos experiencias que describan el trasfondo de tu personaje. Cada una otorga un bonificador de <strong style={{ color: '#d4af37' }}>+2</strong> cuando se aplique en tus tiradas.
            </p>
          </div>

          <div style={styles.expGrid}>
            <div style={styles.expCard}>
              <div style={styles.expHeader}>
                <label style={styles.label}>Experiencia 1:</label>
                <span style={styles.expValueBadge}>+2 a tiradas</span>
              </div>
              <input
                type="text"
                required
                value={exp1}
                onChange={(e) => setExp1(e.target.value)}
                placeholder="Ej. Cazarrecompensas de la Costa, Erudito de Reliquias..."
                style={styles.input}
              />
            </div>

            <div style={styles.expCard}>
              <div style={styles.expHeader}>
                <label style={styles.label}>Experiencia 2:</label>
                <span style={styles.expValueBadge}>+2 a tiradas</span>
              </div>
              <input
                type="text"
                required
                value={exp2}
                onChange={(e) => setExp2(e.target.value)}
                placeholder="Ej. Superviviente de Asedios, Hablante con Bestias..."
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.navRow}>
            <button onClick={() => setStep(2)} style={styles.btnBack}>
              ⬅ Volver a Atributos
            </button>
            <button
              onClick={() => {
                if (!exp1.trim() || !exp2.trim()) {
                  setErrorMsg('Por favor completa ambas experiencias iniciales.');
                  return;
                }
                setErrorMsg(null);
                setStep(4);
              }}
              style={styles.btnNext}
            >
              Siguiente: Equipamiento Inicial ➔
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PASO 4: EQUIPAMIENTO INICIAL (Sprint 12)                            */}
      {/* =================================================================== */}
      {step === 4 && (
        <form onSubmit={handleFinalSubmit} style={styles.stepContent}>
          <div style={styles.stepIntro}>
            <h4 style={styles.stepSubtitle}>⚔️ Equipamiento Inicial de Aventura</h4>
            <p style={styles.stepDesc}>
              Elige el armamento de Tier 1 con el que comienzas tu viaje. El sistema auto-equipará tus armas evaluando las reglas de carga (2 manos).
            </p>
          </div>

          {/* Sub-sección 1: Armadura (Exactamente 1) */}
          <div style={styles.equipmentGroup}>
            <div style={styles.equipmentGroupHeader}>
              <span style={styles.equipmentGroupTitle}>🛡️ 1. Armadura Inicial (Elige exactamente 1)</span>
              <span style={selectedArmor ? styles.countBadgeValid : styles.countBadgePending}>
                {selectedArmor ? '✓ 1 seleccionada' : 'Pendiente (0/1)'}
              </span>
            </div>

            {loadingItems ? (
              <p style={styles.loadingItemsText}>Cargando armaduras...</p>
            ) : armadurasTier1.length === 0 ? (
              <p style={styles.emptyItemsText}>No hay armaduras de Tier 1 disponibles en la base de datos.</p>
            ) : (
              <div style={styles.cardsPickerGrid}>
                {armadurasTier1.map((arm) => {
                  const isSelected = selectedArmor?.id === arm.id;
                  return (
                    <div
                      key={arm.id}
                      onClick={() => setSelectedArmor(arm)}
                      style={isSelected ? styles.pickerCardSelected : styles.pickerCard}
                    >
                      <div style={styles.pickerCardTop}>
                        <strong style={styles.pickerItemName}>{arm.nombre}</strong>
                        <span style={styles.pickerItemTier}>Tier {arm.tier}</span>
                      </div>
                      <div style={styles.pickerItemStats}>
                        <span>Ranuras: <strong>{arm.puntuacionBase}</strong></span>
                        <span>Umbrales: <strong>{arm.umbralMayorBase}/{arm.umbralGraveBase}</strong></span>
                      </div>
                      {arm.rasgoEspecial && (
                        <span style={styles.pickerItemSpecial}>📜 {arm.rasgoEspecial}</span>
                      )}
                      <div style={styles.pickerCardBottom}>
                        <span style={isSelected ? styles.selectedRadioActive : styles.selectedRadio}>
                          {isSelected ? '✓ Seleccionada' : 'Elegir esta'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sub-sección 2: Armas (Exactamente 2) */}
          <div style={styles.equipmentGroup}>
            <div style={styles.equipmentGroupHeader}>
              <span style={styles.equipmentGroupTitle}>⚔️ 2. Armas Iniciales (Elige exactamente 2)</span>
              <span style={selectedWeapons.length === 2 ? styles.countBadgeValid : styles.countBadgePending}>
                {selectedWeapons.length}/2 seleccionadas
              </span>
            </div>

            {loadingItems ? (
              <p style={styles.loadingItemsText}>Cargando armas...</p>
            ) : armasTier1.length === 0 ? (
              <p style={styles.emptyItemsText}>No hay armas de Tier 1 disponibles en la base de datos.</p>
            ) : (
              <div style={styles.cardsPickerGrid}>
                {armasTier1.map((wep) => {
                  const isSelected = selectedWeapons.some((w) => w.id === wep.id);
                  const isMaxReached = selectedWeapons.length >= 2 && !isSelected;

                  return (
                    <div
                      key={wep.id}
                      onClick={() => !isMaxReached && toggleWeaponSelection(wep)}
                      style={
                        isSelected
                          ? styles.pickerCardSelected
                          : isMaxReached
                          ? styles.pickerCardDisabled
                          : styles.pickerCard
                      }
                    >
                      <div style={styles.pickerCardTop}>
                        <strong style={styles.pickerItemName}>{wep.nombre}</strong>
                        <span
                          style={wep.carga === 2 ? styles.cargaBadge2H : styles.cargaBadge1H}
                        >
                          {wep.carga === 2 ? '2 Manos' : '1 Mano'}
                        </span>
                      </div>
                      <div style={styles.pickerItemStats}>
                        <span>🎲 {wep.dadoBase}{wep.modificadorDano >= 0 ? `+${wep.modificadorDano}` : wep.modificadorDano} {wep.tipoDano}</span>
                        <span>📍 {wep.alcance}</span>
                      </div>
                      {wep.rasgo && (
                        <span style={styles.pickerItemSpecial}>⚡ {wep.rasgo}</span>
                      )}
                      <div style={styles.pickerCardBottom}>
                        <span style={isSelected ? styles.selectedRadioActive : styles.selectedRadio}>
                          {isSelected ? '✓ Seleccionada' : isMaxReached ? 'Límite alcanzado' : '+ Elegir'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sub-sección 3: Inventario Rápido (Hasta 10) */}
          <div style={styles.equipmentGroup}>
            <div style={styles.equipmentGroupHeader}>
              <span style={styles.equipmentGroupTitle}>🎒 3. Inventario y Consumibles (Elige hasta 10)</span>
              <span style={styles.countBadge}>
                {selectedItems.length}/10 objetos en mochila
              </span>
            </div>

            <div style={styles.inventoryPickerContainer}>
              {/* Columna Izquierda: Catálogo para agregar */}
              <div style={styles.inventoryPickerCatalog}>
                <span style={styles.invSubTitle}>Objetos Disponibles:</span>
                <div style={styles.invScrollList}>
                  {consumiblesDisponibles.map((it) => {
                    const atLimit = selectedItems.length >= 10;
                    return (
                      <div key={it.id} style={styles.invCatalogRow}>
                        <div style={styles.invRowMeta}>
                          <span style={styles.invRowIcon}>
                            {it.tipo === 'Arma' ? '⚔️' : it.tipo === 'Armadura' ? '🛡️' : '🧪'}
                          </span>
                          <span style={styles.invRowName}>{it.nombre}</span>
                          <span style={styles.invRowDesc}>
                            {it.tipo === 'Consumible' ? it.descripcion : `T${it.tier}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addInventoryItem(it)}
                          disabled={atLimit}
                          style={atLimit ? styles.btnAddInvDisabled : styles.btnAddInv}
                          title={atLimit ? 'Mochila llena (máximo 10)' : 'Añadir a la mochila'}
                        >
                          + Añadir
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna Derecha: Objetos en mochila seleccionados */}
              <div style={styles.inventoryPickerSelected}>
                <span style={styles.invSubTitle}>Contenido de tu Mochila ({selectedItems.length}):</span>
                {selectedItems.length === 0 ? (
                  <p style={styles.emptyInvText}>No has añadido objetos adicionales a tu mochila aún.</p>
                ) : (
                  <div style={styles.invScrollList}>
                    {selectedItems.map((it, idx) => (
                      <div key={`${it.id}-${idx}`} style={styles.invSelectedRow}>
                        <span style={styles.invSelectedName}>
                          {it.tipo === 'Consumible' ? '🧪' : '📦'} {it.nombre}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeInventoryItem(idx)}
                          style={styles.btnRemoveInv}
                          title="Quitar de la mochila"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resumen Final de Auto-Equipado */}
          <div style={styles.summaryCard}>
            <h5 style={styles.summaryTitle}>Resumen del Héroe Listo para Aventura</h5>
            <div style={styles.summaryList}>
              <span>Héroe: <strong>{nombre}</strong></span>
              <span>Clase: <strong>{cards.find((c) => c.id === parseInt(selectedClaseId, 10))?.titulo}</strong></span>
              <span>Armadura: <strong>{selectedArmor?.nombre || '— Sin Armadura —'}</strong></span>
              <span>
                Armas: <strong>{selectedWeapons.map((w) => w.nombre).join(' + ') || '—'}</strong>
              </span>
              <span>
                Mano Principal: <strong>{selectedWeapons[0]?.nombre || '—'}</strong>
              </span>
              <span>
                Mano Secundaria:{' '}
                <strong>
                  {selectedWeapons[0]?.carga === 2
                    ? '🔒 Desarmada (Arma Principal de 2 Manos)'
                    : selectedWeapons[1]?.carga === 1
                    ? selectedWeapons[1]?.nombre
                    : '🔒 En Inventario (Carga 2)'}
                </strong>
              </span>
            </div>
          </div>

          <div style={styles.navRow}>
            <button type="button" onClick={() => setStep(3)} style={styles.btnBack}>
              ⬅ Volver a Experiencias
            </button>
            <button
              type="submit"
              disabled={isSaving || !selectedArmor || selectedWeapons.length !== 2}
              style={
                isSaving || !selectedArmor || selectedWeapons.length !== 2
                  ? styles.btnDisabled
                  : styles.btnSubmitFinal
              }
            >
              {isSaving ? 'Forjando Héroe...' : '⚔️ Finalizar y Forjar Héroe'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// =============================================================================
// Estilos
// =============================================================================
const styles = {
  container: {
    backgroundColor: '#160e06',
    border: '1px solid #4a3728',
    borderRadius: '10px',
    padding: '24px 32px',
    maxWidth: '880px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  wizardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #3a2a1a',
    paddingBottom: '14px',
  },
  wizardTitle: {
    margin: '0 0 4px 0',
    color: '#d4af37',
    fontSize: '1.4rem',
  },
  wizardSubtitle: {
    margin: 0,
    color: '#a0906a',
    fontSize: '0.85rem',
  },
  btnCancelTop: {
    backgroundColor: 'transparent',
    color: '#7a6a5a',
    border: '1px solid #3a2a1a',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.8rem',
  },
  stepsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  stepBadge: {
    backgroundColor: '#100903',
    color: '#7a6a5a',
    border: '1px solid #2a1e12',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '0.78rem',
    textAlign: 'center',
  },
  stepBadgeActive: {
    backgroundColor: '#261608',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#3a1111',
    color: '#ffc7c7',
    border: '1px solid #8b1a1a',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '0.85rem',
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#a0906a',
    fontSize: '0.82rem',
    fontWeight: 'bold',
  },
  inputLarge: {
    backgroundColor: '#0d0905',
    color: '#f5e6d3',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    padding: '12px 14px',
    fontSize: '1.1rem',
    fontFamily: 'inherit',
  },
  input: {
    backgroundColor: '#0d0905',
    color: '#e8dcc8',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '8px 10px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
  },
  select: {
    backgroundColor: '#0d0905',
    color: '#e8dcc8',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '8px 10px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    width: '100%',
  },
  selectDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    borderColor: '#2a1a0e',
    backgroundColor: '#120b06',
    color: '#6a5a4a',
  },
  disabledHint: {
    fontSize: '0.75rem',
    color: '#a07840',
    fontWeight: 'normal',
    marginLeft: '6px',
    fontStyle: 'italic',
  },
  selectorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '14px',
  },
  selectorCard: {
    backgroundColor: '#1b1208',
    border: '1px solid #3a2a1a',
    borderRadius: '6px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardPreview: {
    backgroundColor: '#0d0905',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #2a1e12',
    fontSize: '0.78rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaPreviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#d4af37',
  },
  domainsRow: {
    color: '#a0906a',
  },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #2a1e12',
    paddingTop: '16px',
    marginTop: '6px',
  },
  hint: {
    color: '#7a6a5a',
    fontSize: '0.78rem',
    fontStyle: 'italic',
  },
  btnNext: {
    backgroundColor: '#8b1a1a',
    color: '#f5e6d3',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '0.92rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnBack: {
    backgroundColor: 'transparent',
    color: '#a0906a',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    padding: '10px 18px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnDisabled: {
    backgroundColor: '#24160d',
    color: '#6a5040',
    border: '1px solid #3a2a1a',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '0.92rem',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
  stepIntro: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  stepSubtitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1.05rem',
  },
  stepDesc: {
    margin: 0,
    color: '#a0906a',
    fontSize: '0.85rem',
  },
  attributesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  attrCard: {
    backgroundColor: '#1b1208',
    border: '1px solid #3a2a1a',
    borderRadius: '6px',
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  attrInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  attrName: {
    color: '#e8dcc8',
    fontSize: '0.9rem',
  },
  attrDesc: {
    color: '#7a6a5a',
    fontSize: '0.72rem',
  },
  attrSelect: {
    backgroundColor: '#0d0905',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '1rem',
    fontWeight: 'bold',
    fontFamily: 'inherit',
    minWidth: '60px',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#2b1b08',
    border: '1px solid #c8a040',
    color: '#f5d688',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '0.82rem',
  },
  expGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  expCard: {
    backgroundColor: '#1b1208',
    border: '1px solid #3a2a1a',
    borderRadius: '6px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  expHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expValueBadge: {
    backgroundColor: '#0d0905',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },

  // Paso 4: Equipamiento
  equipmentGroup: {
    backgroundColor: '#150f07',
    border: '1px solid #3a2a1a',
    borderRadius: '8px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  equipmentGroupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #291d12',
    paddingBottom: '6px',
  },
  equipmentGroupTitle: {
    color: '#d4af37',
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
  countBadge: {
    backgroundColor: '#241a0e',
    color: '#a0906a',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '0.75rem',
  },
  countBadgeValid: {
    backgroundColor: '#1b2a1a',
    color: '#7cd37c',
    border: '1px solid #3d6a3d',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  countBadgePending: {
    backgroundColor: '#3a1a15',
    color: '#ff9a85',
    border: '1px solid #7a2b20',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  loadingItemsText: {
    color: '#7a6a5a',
    fontSize: '0.8rem',
    fontStyle: 'italic',
  },
  emptyItemsText: {
    color: '#7a6a5a',
    fontSize: '0.8rem',
    fontStyle: 'italic',
  },
  cardsPickerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  },
  pickerCard: {
    backgroundColor: '#100b05',
    border: '1px solid #3d2c1d',
    borderRadius: '6px',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
  },
  pickerCardSelected: {
    backgroundColor: '#261608',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxShadow: '0 0 8px rgba(212, 175, 55, 0.25)',
  },
  pickerCardDisabled: {
    backgroundColor: '#0a0704',
    border: '1px solid #22160d',
    borderRadius: '6px',
    padding: '10px',
    opacity: 0.45,
    cursor: 'not-allowed',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  pickerCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '4px',
  },
  pickerItemName: {
    color: '#e8dcc8',
    fontSize: '0.85rem',
  },
  pickerItemTier: {
    backgroundColor: '#1b1208',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '3px',
    padding: '1px 5px',
    fontSize: '0.65rem',
  },
  cargaBadge1H: {
    backgroundColor: '#1b2a1a',
    color: '#7cd37c',
    borderRadius: '3px',
    padding: '1px 5px',
    fontSize: '0.65rem',
    fontWeight: 'bold',
  },
  cargaBadge2H: {
    backgroundColor: '#3a1a15',
    color: '#ff9a85',
    borderRadius: '3px',
    padding: '1px 5px',
    fontSize: '0.65rem',
    fontWeight: 'bold',
  },
  pickerItemStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    color: '#b0a08a',
    fontSize: '0.75rem',
  },
  pickerItemSpecial: {
    color: '#9e8c75',
    fontSize: '0.7rem',
    fontStyle: 'italic',
  },
  pickerCardBottom: {
    marginTop: 'auto',
    paddingTop: '6px',
    borderTop: '1px solid #24160d',
    display: 'flex',
    justifyContent: 'center',
  },
  selectedRadio: {
    color: '#7a6a5a',
    fontSize: '0.72rem',
  },
  selectedRadioActive: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: '0.75rem',
  },

  // Inventario interactivo
  inventoryPickerContainer: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '12px',
  },
  inventoryPickerCatalog: {
    backgroundColor: '#0d0905',
    border: '1px solid #2a1e12',
    borderRadius: '6px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inventoryPickerSelected: {
    backgroundColor: '#0d0905',
    border: '1px solid #2a1e12',
    borderRadius: '6px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  invSubTitle: {
    color: '#a08575',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    borderBottom: '1px solid #24160d',
    paddingBottom: '4px',
  },
  invScrollList: {
    maxHeight: '160px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  invCatalogRow: {
    backgroundColor: '#150f07',
    border: '1px solid #2e1f13',
    borderRadius: '4px',
    padding: '5px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '6px',
  },
  invRowMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    overflow: 'hidden',
    flex: 1,
  },
  invRowIcon: {
    fontSize: '0.8rem',
  },
  invRowName: {
    color: '#e8dcc8',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  invRowDesc: {
    color: '#7a6a5a',
    fontSize: '0.68rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  btnAddInv: {
    backgroundColor: '#2e1f0e',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '3px',
    padding: '2px 6px',
    fontSize: '0.68rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  btnAddInvDisabled: {
    backgroundColor: '#19110a',
    color: '#554232',
    border: '1px solid #291a10',
    borderRadius: '3px',
    padding: '2px 6px',
    fontSize: '0.68rem',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  invSelectedRow: {
    backgroundColor: '#1a1208',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '5px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invSelectedName: {
    color: '#e8dcc8',
    fontSize: '0.76rem',
  },
  btnRemoveInv: {
    backgroundColor: 'transparent',
    color: '#ff6b6b',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    padding: '2px 4px',
  },
  emptyInvText: {
    color: '#554232',
    fontSize: '0.72rem',
    fontStyle: 'italic',
    textAlign: 'center',
    margin: '12px 0',
  },

  summaryCard: {
    backgroundColor: '#110a04',
    border: '1px solid #8b1a1a',
    borderRadius: '6px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  summaryTitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '0.88rem',
  },
  summaryList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
    color: '#b0a08a',
    fontSize: '0.8rem',
  },
  btnSubmitFinal: {
    backgroundColor: '#8b1a1a',
    color: '#f5e6d3',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 14px rgba(139, 26, 26, 0.4)',
  },
};
