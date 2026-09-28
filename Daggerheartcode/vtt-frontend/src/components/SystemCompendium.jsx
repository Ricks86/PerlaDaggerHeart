import React, { useState, useEffect } from 'react';
import MarkdownText from './MarkdownText';

// Lista oficial de dominios de Daggerheart
const DAGGERHEART_DOMAINS = [
  'Arcano',
  'Cuchilla',
  'Hueso',
  'Códice',
  'Gracia',
  'Medianoche',
  'Sabiduría',
  'Esplendor',
  'Valor',
];

const CARD_TYPES = [
  'Dominio',
  'Clase',
  'Subclase',
  'Linaje',
  'Comunidad',
  'Homebrew',
];

const TYPE_BADGE_COLORS = {
  Clase:     { bg: '#5c1d1d', text: '#ffd1d1', border: '#8b2626' },
  Subclase:  { bg: '#4a2511', text: '#ffe0cc', border: '#7a3e1d' },
  Linaje:    { bg: '#1c355e', text: '#d0e2ff', border: '#2b528f' },
  Comunidad: { bg: '#1c4a2c', text: '#d1f2db', border: '#2b7546' },
  Dominio:   { bg: '#3a1f4a', text: '#ebd1fa', border: '#61337d' },
  Homebrew:  { bg: '#3b3815', text: '#f5f0b8', border: '#635e23' },
};

/**
 * SystemCompendium: Gestor maestro de cartas fundacionales para el DJ.
 *
 * Permite crear Clases, Subclases, Linajes, Comunidades, Dominios y Homebrew,
 * con campos dinámicos para metadata cuando se selecciona 'Clase'.
 * Permite listar y eliminar cartas directamente en el backend H2.
 */
export default function SystemCompendium() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Estado del formulario maestro
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Dominio',
    nivel: 1,
    descripcion: '',
    // Campos dinámicos para tipo 'Clase'
    evasionBase: 10,
    hpInicial: 6,
    dominio1: 'Gracia',
    dominio2: 'Medianoche',
  });

  // Cargar cartas desde la API
  function loadCards() {
    setLoading(true);
    fetch('http://localhost:8080/api/cards')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setCards(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Compendium] Error al cargar cartas:', err);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadCards();
  }, []);

  function handleFieldChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // Envío del formulario (POST /api/cards)
  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.descripcion.trim()) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);

    // Preparar objeto de metadata si el tipo es 'Clase'
    let metadataString = null;
    if (formData.tipo === 'Clase') {
      const metaObj = {
        evasion_base: parseInt(formData.evasionBase, 10) || 10,
        hp_inicial: parseInt(formData.hpInicial, 10) || 6,
        dominios: [formData.dominio1, formData.dominio2],
      };
      metadataString = JSON.stringify(metaObj);
    }

    const payload = {
      titulo: formData.titulo.trim(),
      tipo: formData.tipo,
      nivel: parseInt(formData.nivel, 10) || 1,
      descripcion: formData.descripcion.trim(),
      metadata: metadataString,
    };

    fetch('http://localhost:8080/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((newCard) => {
        setFeedbackMsg(`✓ Carta "${newCard.titulo}" creada con éxito.`);
        setFormData({
          titulo: '',
          tipo: 'Dominio',
          nivel: 1,
          descripcion: '',
          evasionBase: 10,
          hpInicial: 6,
          dominio1: 'Gracia',
          dominio2: 'Medianoche',
        });
        loadCards();
        setTimeout(() => setFeedbackMsg(null), 4000);
      })
      .catch((err) => {
        setFeedbackMsg(`⚠️ Error al guardar: ${err.message}`);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  // Eliminar carta (DELETE /api/cards/{id})
  function handleDeleteCard(id, titulo) {
    if (!window.confirm(`¿Estás seguro de eliminar la carta "${titulo}"?`)) return;

    fetch(`http://localhost:8080/api/cards/${id}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (res.ok) {
          setCards((prev) => prev.filter((c) => c.id !== id));
          setFeedbackMsg(`🗑️ Carta "${titulo}" eliminada.`);
          setTimeout(() => setFeedbackMsg(null), 3000);
        } else {
          alert('Error al eliminar la carta.');
        }
      })
      .catch((err) => alert(`Error: ${err.message}`));
  }

  return (
    <div style={styles.container}>
      {/* Cabecera del Compendio */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>📚 Compendio del Sistema (Cartas Fundacionales)</h3>
          <p style={styles.subtitle}>
            Crea y gestiona Clases, Subclases, Linajes, Comunidades y Dominios que alimentan las fichas de los jugadores.
          </p>
        </div>
        <span style={styles.counterBadge}>{cards.length} cartas registradas</span>
      </div>

      {feedbackMsg && (
        <div style={styles.feedbackBanner}>
          {feedbackMsg}
        </div>
      )}

      {/* Formulario Maestro de Creación */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <h4 style={styles.formTitle}>✨ Crear Nueva Carta</h4>

        <div style={styles.formGrid}>
          {/* Título */}
          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>Título de la Carta:</label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(e) => handleFieldChange('titulo', e.target.value)}
              placeholder="Ej. Pícaro, Sindicato, Flecha de Hielo..."
              style={styles.input}
            />
          </div>

          {/* Tipo de Carta */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tipo de Carta:</label>
            <select
              value={formData.tipo}
              onChange={(e) => handleFieldChange('tipo', e.target.value)}
              style={styles.select}
            >
              {CARD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Nivel */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nivel:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.nivel}
              onChange={(e) => handleFieldChange('nivel', e.target.value)}
              style={styles.input}
            />
          </div>

          {/* CAMPOS CONDICIONALES PARA TIPO 'Clase' */}
          {formData.tipo === 'Clase' && (
            <div style={styles.classFieldsContainer}>
              <div style={styles.classFieldsHeader}>
                🛡️ Metadatos de Clase (Valores Iniciales y Dominios)
              </div>
              <div style={styles.classFieldsGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Evasión Inicial:</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.evasionBase}
                    onChange={(e) => handleFieldChange('evasionBase', e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>HP Inicial:</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.hpInicial}
                    onChange={(e) => handleFieldChange('hpInicial', e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Dominio Permitido 1:</label>
                  <select
                    value={formData.dominio1}
                    onChange={(e) => handleFieldChange('dominio1', e.target.value)}
                    style={styles.select}
                  >
                    {DAGGERHEART_DOMAINS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Dominio Permitido 2:</label>
                  <select
                    value={formData.dominio2}
                    onChange={(e) => handleFieldChange('dominio2', e.target.value)}
                    style={styles.select}
                  >
                    {DAGGERHEART_DOMAINS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Descripción con soporte Markdown */}
          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Descripción y Habilidad (soporta Markdown):</label>
              <span style={styles.hintText}>Usa **texto** para costes y negritas</span>
            </div>
            <textarea
              required
              rows={4}
              value={formData.descripcion}
              onChange={(e) => handleFieldChange('descripcion', e.target.value)}
              placeholder="**Acción:** Gasta **1 Esperanza** para..."
              style={styles.textarea}
            />
          </div>
        </div>

        {/* Vista Previa de Markdown de la descripción */}
        {formData.descripcion.trim() && (
          <div style={styles.previewBox}>
            <span style={styles.previewLabel}>Vista Previa de Renderizado:</span>
            <MarkdownText text={formData.descripcion} />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={isSubmitting ? styles.btnSubmitDisabled : styles.btnSubmit}
        >
          {isSubmitting ? 'Guardando en Base de Datos...' : '💾 Guardar Carta en el Compendio'}
        </button>
      </form>

      {/* Tabla del Compendio */}
      <div style={styles.tableSection}>
        <h4 style={styles.tableSectionTitle}>Catálogo de Cartas Existentes</h4>

        {loading ? (
          <p style={styles.emptyText}>⏳ Cargando compendio...</p>
        ) : cards.length === 0 ? (
          <p style={styles.emptyText}>No hay cartas registradas en la base de datos.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Nivel</th>
                  <th style={styles.th}>Descripción</th>
                  <th style={styles.th}>Metadatos</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => {
                  const badgeStyle = TYPE_BADGE_COLORS[c.tipo] || {
                    bg: '#241a0e',
                    text: '#d4af37',
                    border: '#4a3728',
                  };

                  let parsedMeta = null;
                  if (c.metadata) {
                    try {
                      parsedMeta = JSON.parse(c.metadata);
                    } catch {
                      parsedMeta = null;
                    }
                  }

                  return (
                    <tr key={c.id} style={styles.tr}>
                      <td style={styles.tdId}>#{c.id}</td>
                      <td style={styles.tdTitle}>
                        <strong>{c.titulo}</strong>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.typeBadge,
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.text,
                            borderColor: badgeStyle.border,
                          }}
                        >
                          {c.tipo}
                        </span>
                      </td>
                      <td style={styles.tdCenter}>{c.nivel}</td>
                      <td style={styles.tdDesc}>
                        <div style={styles.descContainer}>
                          <MarkdownText text={c.descripcion} />
                        </div>
                      </td>
                      <td style={styles.tdMeta}>
                        {parsedMeta ? (
                          <div style={styles.metaChips}>
                            {parsedMeta.evasion_base != null && (
                              <span style={styles.metaChip}>
                                Eva: {parsedMeta.evasion_base}
                              </span>
                            )}
                            {parsedMeta.hp_inicial != null && (
                              <span style={styles.metaChip}>
                                HP: {parsedMeta.hp_inicial}
                              </span>
                            )}
                            {parsedMeta.dominios && (
                              <span style={styles.metaChipDomains}>
                                {parsedMeta.dominios.join(' · ')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={styles.noMeta}>—</span>
                        )}
                      </td>
                      <td style={styles.tdAction}>
                        <button
                          onClick={() => handleDeleteCard(c.id, c.titulo)}
                          style={styles.btnDelete}
                          title={`Eliminar "${c.titulo}"`}
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
  container: {
    backgroundColor: '#140d06',
    border: '1px solid #4a3728',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #4a3728',
    paddingBottom: '12px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  title: {
    margin: '0 0 4px 0',
    color: '#d4af37',
    fontSize: '1.2rem',
    letterSpacing: '0.5px',
  },
  subtitle: {
    margin: 0,
    color: '#a0906a',
    fontSize: '0.82rem',
  },
  counterBadge: {
    backgroundColor: '#241a0e',
    color: '#d4af37',
    border: '1px solid #4a3728',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  feedbackBanner: {
    backgroundColor: '#221508',
    border: '1px solid #d4af37',
    color: '#f5e6d3',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '0.88rem',
  },
  form: {
    backgroundColor: '#1b1208',
    border: '1px solid #6b4e28',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formTitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1rem',
    borderBottom: '1px solid #3a2a1a',
    paddingBottom: '8px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    color: '#a0906a',
    fontSize: '0.78rem',
    fontWeight: 'bold',
  },
  hintText: {
    color: '#7a6a5a',
    fontSize: '0.72rem',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#0d0905',
    color: '#e8dcc8',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '8px 10px',
    fontSize: '0.88rem',
    fontFamily: 'inherit',
  },
  select: {
    backgroundColor: '#0d0905',
    color: '#e8dcc8',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '8px 10px',
    fontSize: '0.88rem',
    fontFamily: 'inherit',
  },
  textarea: {
    backgroundColor: '#0d0905',
    color: '#e8dcc8',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '8px 10px',
    fontSize: '0.88rem',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  classFieldsContainer: {
    gridColumn: 'span 2',
    backgroundColor: '#120a04',
    border: '1px solid #8b1a1a',
    borderRadius: '6px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  classFieldsHeader: {
    color: '#f4c430',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  classFieldsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
  },
  previewBox: {
    backgroundColor: '#0d0905',
    border: '1px dashed #4a3728',
    borderRadius: '6px',
    padding: '10px 14px',
  },
  previewLabel: {
    display: 'block',
    color: '#7a6a5a',
    fontSize: '0.72rem',
    marginBottom: '6px',
    textTransform: 'uppercase',
  },
  btnSubmit: {
    backgroundColor: '#8b1a1a',
    color: '#f5e6d3',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
  },
  btnSubmitDisabled: {
    backgroundColor: '#3a2015',
    color: '#7a6a5a',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '0.95rem',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
  tableSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  tableSectionTitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1rem',
  },
  emptyText: {
    color: '#7a6a5a',
    fontStyle: 'italic',
    padding: '16px',
    textAlign: 'center',
  },
  tableWrapper: {
    overflowX: 'auto',
    border: '1px solid #4a3728',
    borderRadius: '6px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.82rem',
  },
  th: {
    backgroundColor: '#20150b',
    color: '#d4af37',
    padding: '10px 12px',
    borderBottom: '1px solid #4a3728',
    fontWeight: 'bold',
  },
  tr: {
    borderBottom: '1px solid #2a1e12',
    backgroundColor: '#160e06',
  },
  tdId: {
    padding: '8px 12px',
    color: '#7a6a5a',
    fontSize: '0.75rem',
  },
  tdTitle: {
    padding: '8px 12px',
    color: '#e8dcc8',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '8px 12px',
  },
  tdCenter: {
    padding: '8px 12px',
    textAlign: 'center',
    color: '#d4af37',
  },
  tdDesc: {
    padding: '8px 12px',
    maxWidth: '300px',
  },
  descContainer: {
    maxHeight: '80px',
    overflowY: 'auto',
  },
  tdMeta: {
    padding: '8px 12px',
    minWidth: '120px',
  },
  metaChips: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  metaChip: {
    backgroundColor: '#241a0e',
    color: '#a0906a',
    padding: '1px 6px',
    borderRadius: '3px',
    fontSize: '0.72rem',
    border: '1px solid #3a2a1a',
  },
  metaChipDomains: {
    backgroundColor: '#3a1f4a',
    color: '#ebd1fa',
    padding: '1px 6px',
    borderRadius: '3px',
    fontSize: '0.72rem',
    border: '1px solid #61337d',
  },
  noMeta: {
    color: '#4a3728',
  },
  tdAction: {
    padding: '8px 12px',
    textAlign: 'center',
  },
  typeBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    border: '1px solid',
    whiteSpace: 'nowrap',
  },
  btnDelete: {
    backgroundColor: 'transparent',
    color: '#e74c3c',
    border: '1px solid #8b1a1a',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
};
