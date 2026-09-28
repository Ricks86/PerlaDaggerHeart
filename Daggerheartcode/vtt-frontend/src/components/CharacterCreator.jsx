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
 * CharacterCreator: Wizard guiado para crear nuevos personajes de Nivel 1.
 *
 * Pasos:
 *  1. Orígenes: Nombre, Clase, Subclase, Linaje, Comunidad (lee metadata de Clase).
 *  2. Rasgos: Asignación de la matriz estándar (+2, +1, +1, +0, +0, -1).
 *  3. Experiencias Iniciales: 2 experiencias con valor fijo +2.
 *  Guardado: POST /api/characters e inserción de las 4 cartas fundacionales en cartasActivasIds.
 */
export default function CharacterCreator({ onComplete, onCancel }) {
  const [step, setStep] = useState(1); // 1, 2, 3
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
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

  // Carga de catálogo de cartas para el wizard
  useEffect(() => {
    fetch('http://localhost:8080/api/cards')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setCards(data);
        setLoadingCards(false);

        // Preseleccionar primeros elementos si existen
        const clases = data.filter((c) => c.tipo === 'Clase');
        const subclases = data.filter((c) => c.tipo === 'Subclase');
        const linajes = data.filter((c) => c.tipo === 'Linaje' || c.tipo === 'Ancestro');
        const comunidades = data.filter((c) => c.tipo === 'Comunidad');

        if (clases.length > 0) handleClaseChange(clases[0].id, data);
        if (subclases.length > 0) setSelectedSubclaseId(subclases[0].id);
        if (linajes.length > 0) setSelectedLinajeId(linajes[0].id);
        if (comunidades.length > 0) setSelectedComunidadId(comunidades[0].id);
      })
      .catch((err) => {
        console.error('[CharacterCreator] Error cargando cartas:', err);
        setLoadingCards(false);
      });
  }, []);

  function handleClaseChange(id, cardList = cards) {
    setSelectedClaseId(id);
    const claseCard = cardList.find((c) => c.id === parseInt(id, 10));
    if (claseCard?.metadata) {
      try {
        const meta = JSON.parse(claseCard.metadata);
        setClaseMetadata({
          evasion_base: meta.evasion_base || 10,
          hp_inicial: meta.hp_inicial || 6,
          dominios: meta.dominios || ['Arcano', 'Medianoche'],
        });
      } catch (e) {
        console.warn('Error al parsear metadata de clase:', e);
      }
    }
  }

  // Validación de la matriz estándar del Paso 2
  function validateStandardArray() {
    const values = Object.values(atributos).sort((a, b) => b - a);
    const expected = [...STANDARD_ARRAY].sort((a, b) => b - a);
    return JSON.stringify(values) === JSON.stringify(expected);
  }

  // Guardado Final: POST /api/characters
  function handleFinalSubmit(e) {
    e.preventDefault();
    if (!nombre.trim() || !exp1.trim() || !exp2.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
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
      inventarioIds: [],
      cartasActivasIds: foundationCardIds,
    };

    fetch('http://localhost:8080/api/characters', {
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
  const subclasesDisponibles = cards.filter((c) => c.tipo === 'Subclase');
  const linajesDisponibles = cards.filter((c) => c.tipo === 'Linaje' || c.tipo === 'Ancestro');
  const comunidadesDisponibles = cards.filter((c) => c.tipo === 'Comunidad');

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
          1. Orígenes y Cartas Base
        </div>
        <div style={step === 2 ? styles.stepBadgeActive : styles.stepBadge}>
          2. Matriz de Atributos
        </div>
        <div style={step === 3 ? styles.stepBadgeActive : styles.stepBadge}>
          3. Experiencias y Guardado
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
              <label style={styles.label}>2. Subclase:</label>
              <select
                value={selectedSubclaseId}
                onChange={(e) => setSelectedSubclaseId(e.target.value)}
                style={styles.select}
              >
                {subclasesDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.titulo}</option>
                ))}
              </select>
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
        <form onSubmit={handleFinalSubmit} style={styles.stepContent}>
          <div style={styles.stepIntro}>
            <h4 style={styles.stepSubtitle}>Experiencias Fundacionales (Nivel 1)</h4>
            <p style={styles.stepDesc}>
              Define dos experiencias que describan el trasfondo de tu personaje. Cada una otorga un bonificador bloqueado en <strong style={{ color: '#d4af37' }}>+2</strong> cuando se aplique en tus tiradas.
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

          {/* Resumen Final */}
          <div style={styles.summaryCard}>
            <h5 style={styles.summaryTitle}>Resumen del Personaje a Forjar</h5>
            <div style={styles.summaryList}>
              <span>Héroe: <strong>{nombre}</strong></span>
              <span>Clase: <strong>{cards.find((c) => c.id === parseInt(selectedClaseId, 10))?.titulo}</strong></span>
              <span>HP / Evasión: <strong>{claseMetadata.hp_inicial} HP / {claseMetadata.evasion_base} Eva</strong></span>
              <span>Dominios: <strong>{claseMetadata.dominios.join(', ')}</strong></span>
            </div>
          </div>

          <div style={styles.navRow}>
            <button type="button" onClick={() => setStep(2)} style={styles.btnBack}>
              ⬅ Volver a Rasgos
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={isSaving ? styles.btnDisabled : styles.btnSubmitFinal}
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
    maxWidth: '850px',
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
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  stepBadge: {
    backgroundColor: '#100903',
    color: '#7a6a5a',
    border: '1px solid #2a1e12',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '0.8rem',
    textAlign: 'center',
  },
  stepBadgeActive: {
    backgroundColor: '#261608',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '0.8rem',
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
