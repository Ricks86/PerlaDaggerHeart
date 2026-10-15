import React, { useState } from 'react';
import MarkdownText from './MarkdownText';
import DataImporter from './DataImporter';
import { useCards } from '../context/CompendiumContext';

// Lista oficial de dominios de Daggerheart (nombres canónicos compatibles con JSONs y etiquetas bilingües)
const DAGGERHEART_DOMAINS = [
  { id: 'Arcana', label: 'Arcana (Arcano)' },
  { id: 'Blade', label: 'Blade (Cuchilla / Filo)' },
  { id: 'Bone', label: 'Bone (Hueso)' },
  { id: 'Codex', label: 'Codex (Códice)' },
  { id: 'Grace', label: 'Grace (Gracia)' },
  { id: 'Midnight', label: 'Midnight (Medianoche)' },
  { id: 'Sage', label: 'Sage (Sabiduría / Sabio)' },
  { id: 'Splendor', label: 'Splendor (Esplendor)' },
  { id: 'Valor', label: 'Valor' },
  { id: 'Dread', label: 'Dread (Pavor)' },
  { id: 'Otro', label: 'Otro / Personalizado...' },
];

const DOMAIN_SUBTYPES = [
  'Habilidad',
  'Conjuro',
  'Grimorio',
  'Otro',
];

const HOMEBREW_CATEGORIES = [
  'Dominio',
  'Clase',
  'Subclase',
  'Linaje',
  'Comunidad',
  'Regla Especial / Otro',
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

const INITIAL_FORM_STATE = {
  titulo: '',
  tipo: 'Dominio',
  nivel: 1,
  descripcion: '',
  esHomebrew: false,

  // Campos específicos para 'Dominio'
  dominioCarta: 'Arcana',
  dominioPersonalizado: '',
  subtipoDominio: 'Habilidad',
  subtipoPersonalizado: '',
  costeRecuperacion: 0,

  // Campos específicos para 'Clase'
  evasionBase: 10,
  hpInicial: 6,
  dominio1: 'Grace',
  dominio2: 'Midnight',

  // Campos específicos para 'Subclase'
  clasePadre: '',

  // Categoría base para 'Homebrew'
  categoriaHomebrew: 'Dominio',
};

/**
 * SystemCompendium: Gestor maestro de cartas fundacionales para el DJ.
 *
 * Permite crear Clases, Subclases, Linajes, Comunidades, Dominios y Homebrew,
 * con campos dinámicos para metadata específica.
 * Permite listar y eliminar cartas directamente en la base de datos persistente.
 */
export default function SystemCompendium() {
  const { cards, loading, refresh: refreshCards } = useCards();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [compendiumView, setCompendiumView] = useState('FORM'); // 'FORM' | 'BULK_IMPORT'

  // Estado del formulario maestro
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  function handleFieldChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // Envío del formulario (POST /api/cards)
  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.descripcion.trim()) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);

    const isHomebrewCard = Boolean(formData.tipo === 'Homebrew' || formData.esHomebrew);
    let metadataString = null;

    if (formData.tipo === 'Dominio') {
      const finalDominio = formData.dominioCarta === 'Otro'
        ? (formData.dominioPersonalizado.trim() || 'Personalizado')
        : formData.dominioCarta;
      const finalSubtipo = formData.subtipoDominio === 'Otro'
        ? (formData.subtipoPersonalizado.trim() || 'Habilidad')
        : formData.subtipoDominio;

      const metaObj = {
        dominio: finalDominio,
        subtipo: finalSubtipo,
        coste_recuperacion: parseInt(formData.costeRecuperacion, 10) || 0,
      };
      if (isHomebrewCard) {
        metaObj.es_homebrew = true;
      }
      metadataString = JSON.stringify(metaObj);
    } else if (formData.tipo === 'Clase') {
      const metaObj = {
        evasion_base: parseInt(formData.evasionBase, 10) || 10,
        hp_inicial: parseInt(formData.hpInicial, 10) || 6,
        dominios: [formData.dominio1, formData.dominio2],
      };
      if (isHomebrewCard) {
        metaObj.es_homebrew = true;
      }
      metadataString = JSON.stringify(metaObj);
    } else if (formData.tipo === 'Subclase') {
      const metaObj = {
        clase_padre: formData.clasePadre ? formData.clasePadre.trim() : '',
      };
      if (isHomebrewCard) {
        metaObj.es_homebrew = true;
      }
      metadataString = JSON.stringify(metaObj);
    } else if (formData.tipo === 'Homebrew') {
      const metaObj = {
        es_homebrew: true,
        categoria_homebrew: formData.categoriaHomebrew,
      };
      if (formData.categoriaHomebrew === 'Dominio') {
        const finalDominio = formData.dominioCarta === 'Otro'
          ? (formData.dominioPersonalizado.trim() || 'Personalizado')
          : formData.dominioCarta;
        const finalSubtipo = formData.subtipoDominio === 'Otro'
          ? (formData.subtipoPersonalizado.trim() || 'Habilidad')
          : formData.subtipoDominio;
        metaObj.dominio = finalDominio;
        metaObj.subtipo = finalSubtipo;
        metaObj.coste_recuperacion = parseInt(formData.costeRecuperacion, 10) || 0;
      } else if (formData.categoriaHomebrew === 'Clase') {
        metaObj.evasion_base = parseInt(formData.evasionBase, 10) || 10;
        metaObj.hp_inicial = parseInt(formData.hpInicial, 10) || 6;
        metaObj.dominios = [formData.dominio1, formData.dominio2];
      } else if (formData.categoriaHomebrew === 'Subclase') {
        metaObj.clase_padre = formData.clasePadre ? formData.clasePadre.trim() : '';
      }
      metadataString = JSON.stringify(metaObj);
    } else if (isHomebrewCard) {
      metadataString = JSON.stringify({ es_homebrew: true });
    }

    const payload = {
      titulo: formData.titulo.trim(),
      tipo: formData.tipo,
      nivel: parseInt(formData.nivel, 10) || 1,
      descripcion: formData.descripcion.trim(),
      metadata: metadataString,
      esHomebrew: isHomebrewCard,
    };

    fetch('/api/cards', {
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
        setFormData(INITIAL_FORM_STATE);
        refreshCards();
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

    fetch(`/api/cards/${id}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (res.ok) {
          refreshCards();
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

      {/* Selector de Modo: Crear Carta Manual vs Ingesta Masiva */}
      <div style={styles.viewModeNav}>
        <button
          type="button"
          onClick={() => setCompendiumView('FORM')}
          style={compendiumView === 'FORM' ? styles.subTabActive : styles.subTab}
        >
          ✨ Crear Carta Individual
        </button>
        <button
          type="button"
          onClick={() => setCompendiumView('BULK_IMPORT')}
          style={compendiumView === 'BULK_IMPORT' ? styles.subTabActive : styles.subTab}
        >
          📥 Ingesta Masiva (JSON)
        </button>
      </div>

      {compendiumView === 'BULK_IMPORT' ? (
        <DataImporter onImportSuccess={loadCards} />
      ) : (
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

          {/* Opción Homebrew Global */}
          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={formData.tipo === 'Homebrew' || formData.esHomebrew}
                disabled={formData.tipo === 'Homebrew'}
                onChange={(e) => handleFieldChange('esHomebrew', e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxLabel}>
                🌟 Marcar como Contenido Homebrew (creación personalizada del DJ)
                {formData.tipo === 'Homebrew' && ' (Activo por defecto al ser Tipo Homebrew)'}
              </span>
            </label>
          </div>

          {/* CAMPOS CONDICIONALES PARA TIPO 'Dominio' */}
          {formData.tipo === 'Dominio' && (
            <div style={styles.domainFieldsContainer}>
              <div style={styles.domainFieldsHeader}>
                🔮 Metadatos de Carta de Dominio
              </div>
              <div style={styles.domainFieldsGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Dominio al que pertenece:</label>
                  <select
                    value={formData.dominioCarta}
                    onChange={(e) => handleFieldChange('dominioCarta', e.target.value)}
                    style={styles.select}
                  >
                    {DAGGERHEART_DOMAINS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.dominioCarta === 'Otro' && (
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Nombre de Dominio Personalizado:</label>
                    <input
                      type="text"
                      required
                      value={formData.dominioPersonalizado}
                      onChange={(e) => handleFieldChange('dominioPersonalizado', e.target.value)}
                      placeholder="Ej. Sangre, Vacío, Tempestad..."
                      style={styles.input}
                    />
                  </div>
                )}

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Subtipo de Dominio:</label>
                  <select
                    value={formData.subtipoDominio}
                    onChange={(e) => handleFieldChange('subtipoDominio', e.target.value)}
                    style={styles.select}
                  >
                    {DOMAIN_SUBTYPES.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {formData.subtipoDominio === 'Otro' && (
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Subtipo Personalizado:</label>
                    <input
                      type="text"
                      required
                      value={formData.subtipoPersonalizado}
                      onChange={(e) => handleFieldChange('subtipoPersonalizado', e.target.value)}
                      placeholder="Ej. Técnica, Encantamiento..."
                      style={styles.input}
                    />
                  </div>
                )}

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Coste de Recuperación (Recall):</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.costeRecuperacion}
                    onChange={(e) => handleFieldChange('costeRecuperacion', e.target.value)}
                    style={styles.input}
                  />
                  <span style={styles.hintText}>
                    0 = Sin coste de preparación. 1-4 = Fichas/ranuras en descanso o preparación.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS CONDICIONALES PARA TIPO 'Homebrew' */}
          {formData.tipo === 'Homebrew' && (
            <div style={styles.homebrewFieldsContainer}>
              <div style={styles.homebrewFieldsHeader}>
                🧪 Configuración de Material Homebrew
              </div>
              <div style={{ ...styles.inputGroup, marginBottom: '4px' }}>
                <label style={styles.label}>Categoría Base del Homebrew:</label>
                <select
                  value={formData.categoriaHomebrew}
                  onChange={(e) => handleFieldChange('categoriaHomebrew', e.target.value)}
                  style={styles.select}
                >
                  {HOMEBREW_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <span style={styles.hintText}>
                  Define la estructura para que interactúe correctamente con los personajes y el compendio.
                </span>
              </div>

              {formData.categoriaHomebrew === 'Dominio' && (
                <div style={styles.domainFieldsGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Dominio:</label>
                    <select
                      value={formData.dominioCarta}
                      onChange={(e) => handleFieldChange('dominioCarta', e.target.value)}
                      style={styles.select}
                    >
                      {DAGGERHEART_DOMAINS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.dominioCarta === 'Otro' && (
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Nombre de Dominio Personalizado:</label>
                      <input
                        type="text"
                        required
                        value={formData.dominioPersonalizado}
                        onChange={(e) => handleFieldChange('dominioPersonalizado', e.target.value)}
                        placeholder="Ej. Sangre, Vacío, Ilusión..."
                        style={styles.input}
                      />
                    </div>
                  )}

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Subtipo:</label>
                    <select
                      value={formData.subtipoDominio}
                      onChange={(e) => handleFieldChange('subtipoDominio', e.target.value)}
                      style={styles.select}
                    >
                      {DOMAIN_SUBTYPES.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  {formData.subtipoDominio === 'Otro' && (
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Subtipo Personalizado:</label>
                      <input
                        type="text"
                        required
                        value={formData.subtipoPersonalizado}
                        onChange={(e) => handleFieldChange('subtipoPersonalizado', e.target.value)}
                        placeholder="Ej. Técnica, Encantamiento..."
                        style={styles.input}
                      />
                    </div>
                  )}

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Coste de Recuperación:</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.costeRecuperacion}
                      onChange={(e) => handleFieldChange('costeRecuperacion', e.target.value)}
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              {formData.categoriaHomebrew === 'Clase' && (
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
                      {DAGGERHEART_DOMAINS.filter((d) => d.id !== 'Otro').map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
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
                      {DAGGERHEART_DOMAINS.filter((d) => d.id !== 'Otro').map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {formData.categoriaHomebrew === 'Subclase' && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Clase Padre a la que pertenece:</label>
                  <input
                    type="text"
                    required
                    value={formData.clasePadre}
                    onChange={(e) => handleFieldChange('clasePadre', e.target.value)}
                    placeholder="Ej. Pícaro, Guerrero, Guardabosques..."
                    style={styles.input}
                    list="clases-existentes"
                  />
                  <datalist id="clases-existentes">
                    {cards
                      .filter((c) => c.tipo === 'Clase')
                      .map((c) => (
                        <option key={c.id} value={c.titulo} />
                      ))}
                  </datalist>
                </div>
              )}
            </div>
          )}

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
                    {DAGGERHEART_DOMAINS.filter((d) => d.id !== 'Otro').map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
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
                    {DAGGERHEART_DOMAINS.filter((d) => d.id !== 'Otro').map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Campos dinámicos para tipo 'Subclase' */}
          {formData.tipo === 'Subclase' && (
            <div style={{ ...styles.classFieldsContainer, borderColor: '#7a3e1d', gridColumn: 'span 2' }}>
              <div style={{ ...styles.classFieldsHeader, color: '#ffe0cc' }}>
                ⚙️ Configuración de Subclase
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Clase Padre a la que pertenece:</label>
                <input
                  type="text"
                  required
                  value={formData.clasePadre}
                  onChange={(e) => handleFieldChange('clasePadre', e.target.value)}
                  placeholder="Ej. Pícaro, Guerrero, Guardabosques..."
                  style={styles.input}
                  list="clases-existentes"
                />
                <datalist id="clases-existentes">
                  {cards
                    .filter((c) => c.tipo === 'Clase')
                    .map((c) => (
                      <option key={c.id} value={c.titulo} />
                    ))}
                </datalist>
                <span style={styles.hintText}>
                  La subclase solo aparecerá en el creador cuando el jugador elija esta Clase Padre.
                </span>
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
      )}


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
                            {/* Chip Homebrew */}
                            {(c.esHomebrew || parsedMeta.es_homebrew || c.tipo === 'Homebrew') && (
                              <span style={styles.metaChipHomebrew}>
                                ⭐ Homebrew{parsedMeta.categoria_homebrew ? ` (${parsedMeta.categoria_homebrew})` : ''}
                              </span>
                            )}

                            {/* Metadatos de Dominio */}
                            {parsedMeta.dominio && (
                              <span style={styles.metaChipDominio}>
                                🔮 Dom: {parsedMeta.dominio}
                              </span>
                            )}
                            {parsedMeta.subtipo && (
                              <span style={styles.metaChipSubtipo}>
                                🏷️ {parsedMeta.subtipo}
                              </span>
                            )}
                            {parsedMeta.coste_recuperacion != null && (
                              <span style={styles.metaChipRecall}>
                                🔄 Recup: {parsedMeta.coste_recuperacion}
                              </span>
                            )}

                            {/* Metadatos de Clase / Subclase */}
                            {parsedMeta.clase_padre && (
                              <span style={styles.metaChip}>
                                Clase: {parsedMeta.clase_padre}
                              </span>
                            )}
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
                          c.esHomebrew || c.tipo === 'Homebrew' ? (
                            <span style={styles.metaChipHomebrew}>⭐ Homebrew</span>
                          ) : (
                            <span style={styles.noMeta}>—</span>
                          )
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
  viewModeNav: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #3a2a1a',
    paddingBottom: '2px',
  },
  subTab: {
    backgroundColor: 'transparent',
    color: '#a0906a',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '7px 14px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  subTabActive: {
    backgroundColor: '#1c1108',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderBottom: '2px solid #d4af37',
    padding: '7px 14px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    cursor: 'default',
    fontFamily: 'inherit',
    borderRadius: '4px 4px 0 0',
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
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    backgroundColor: '#120b05',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px dashed #6b4e28',
    width: 'fit-content',
  },
  checkbox: {
    cursor: 'pointer',
    accentColor: '#d4af37',
    width: '16px',
    height: '16px',
  },
  checkboxLabel: {
    color: '#e8dcc8',
    fontSize: '0.82rem',
    fontWeight: '500',
  },
  domainFieldsContainer: {
    gridColumn: 'span 2',
    backgroundColor: '#160d1a',
    border: '1px solid #61337d',
    borderRadius: '6px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  domainFieldsHeader: {
    color: '#ebd1fa',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  domainFieldsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '10px',
  },
  homebrewFieldsContainer: {
    gridColumn: 'span 2',
    backgroundColor: '#1c1b0a',
    border: '1px solid #635e23',
    borderRadius: '6px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  homebrewFieldsHeader: {
    color: '#f5f0b8',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
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
  metaChipHomebrew: {
    backgroundColor: '#3b3815',
    color: '#f5f0b8',
    padding: '1px 6px',
    borderRadius: '3px',
    fontSize: '0.72rem',
    border: '1px solid #736b22',
    fontWeight: '600',
  },
  metaChipDominio: {
    backgroundColor: '#3a1f4a',
    color: '#ebd1fa',
    padding: '1px 6px',
    borderRadius: '3px',
    fontSize: '0.72rem',
    border: '1px solid #61337d',
    fontWeight: '500',
  },
  metaChipSubtipo: {
    backgroundColor: '#1b3240',
    color: '#bce4fa',
    padding: '1px 6px',
    borderRadius: '3px',
    fontSize: '0.72rem',
    border: '1px solid #2b556f',
  },
  metaChipRecall: {
    backgroundColor: '#282118',
    color: '#e5b874',
    padding: '1px 6px',
    borderRadius: '3px',
    fontSize: '0.72rem',
    border: '1px solid #5a452a',
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
