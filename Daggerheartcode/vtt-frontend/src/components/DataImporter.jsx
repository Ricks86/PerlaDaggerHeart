import React, { useState } from 'react';

/**
 * DataImporter: Motor de Importación Masiva (Bulk Import) para el Dungeon Master.
 *
 * Permite cargar un archivo .json o pegar JSON en texto plano para insertar
 * múltiples cartas de golpe en el backend mediante POST /api/cards/bulk.
 *
 * @param {Function} onImportSuccess - Callback para refrescar la tabla del compendio.
 */
export default function DataImporter({ onImportSuccess }) {
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); // { type: 'success' | 'error', message: string, count?: number }
  const [previewCount, setPreviewCount] = useState(null);

  // Manejar selección de archivo mediante FileReader
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setAlertInfo(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setJsonText(content);
        tryPreParse(content);
      }
    };
    reader.onerror = () => {
      setAlertInfo({
        type: 'error',
        message: 'No se pudo leer el archivo seleccionado.',
      });
    };
    reader.readAsText(file);
  }

  // Pre-analizar texto para dar feedback rápido de cartas detectadas
  function tryPreParse(text) {
    if (!text.trim()) {
      setPreviewCount(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.cards)
        ? parsed.cards
        : [parsed];
      setPreviewCount(list.length);
    } catch {
      setPreviewCount(null);
    }
  }

  // Manejar cambio manual en el textarea
  function handleTextChange(e) {
    const val = e.target.value;
    setJsonText(val);
    setAlertInfo(null);
    tryPreParse(val);
  }

  // Enviar el array de cartas a /api/cards/bulk
  function handleImportSubmit(e) {
    e.preventDefault();
    if (!jsonText.trim()) {
      setAlertInfo({
        type: 'error',
        message: 'Por favor selecciona un archivo .json o pega el contenido en el área de texto.',
      });
      return;
    }

    setIsProcessing(true);
    setAlertInfo(null);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      setIsProcessing(false);
      setAlertInfo({
        type: 'error',
        message: `Error de sintaxis en el JSON: ${err.message}`,
      });
      return;
    }

    // Normalizar a array de cartas
    let cardsArray = [];
    if (Array.isArray(parsed)) {
      cardsArray = parsed;
    } else if (Array.isArray(parsed.cards)) {
      cardsArray = parsed.cards;
    } else if (typeof parsed === 'object' && parsed !== null) {
      cardsArray = [parsed];
    } else {
      setIsProcessing(false);
      setAlertInfo({
        type: 'error',
        message: 'El formato del JSON debe ser una lista de cartas o un objeto con propiedad "cards".',
      });
      return;
    }

    if (cardsArray.length === 0) {
      setIsProcessing(false);
      setAlertInfo({
        type: 'error',
        message: 'No se encontraron cartas para importar en el JSON proporcionado.',
      });
      return;
    }

    // Asegurar estructura limpia para la entidad Card
    const sanitizedCards = cardsArray.map((c) => {
      let metaStr = null;
      if (typeof c.metadata === 'object' && c.metadata !== null) {
        metaStr = JSON.stringify(c.metadata);
      } else if (typeof c.metadata === 'string') {
        metaStr = c.metadata;
      }

      return {
        titulo: c.titulo || 'Sin título',
        tipo: c.tipo || 'Dominio',
        nivel: parseInt(c.nivel || 1, 10),
        descripcion: c.descripcion || '',
        metadata: metaStr,
      };
    });

    // Enviar POST /api/cards/bulk
    fetch('/api/cards/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedCards),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const count = data.count || sanitizedCards.length;
        setAlertInfo({
          type: 'success',
          message: `✓ ¡Ingesta Masiva Exitosa! Se han insertado ${count} carta(s) en la base de datos.`,
          count,
        });

        // Limpiar inputs
        setJsonText('');
        setFileName('');
        setPreviewCount(null);

        // Notificar al compendio para refrescar su tabla
        if (onImportSuccess) {
          onImportSuccess();
        }
      })
      .catch((err) => {
        console.error('[BulkImport] Error:', err);
        setAlertInfo({
          type: 'error',
          message: `Error al comunicar con el servidor: ${err.message}`,
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }

  // Ejemplo de JSON plantilla para facilitar la vida al DJ
  function handleLoadTemplate() {
    const template = [
      {
        titulo: "Golpe de Sombras",
        tipo: "Dominio",
        nivel: 1,
        descripcion: "**Acción:** Gasta **1 Esperanza** para realizar un ataque imbuido con oscuridad.",
        metadata: null
      },
      {
        titulo: "Guardián de Éter",
        tipo: "Homebrew",
        nivel: 1,
        descripcion: "**Habilidad Especial:** Absorbe **2 puntos de daño** mágico por descanso largo.",
        metadata: null
      }
    ];
    const str = JSON.stringify(template, null, 2);
    setJsonText(str);
    tryPreParse(str);
    setAlertInfo(null);
  }

  return (
    <div style={styles.container}>
      {/* Cabecera del Importador */}
      <div style={styles.header}>
        <div style={styles.headerTitleGroup}>
          <span style={styles.icon}>📥</span>
          <div>
            <h3 style={styles.title}>Motor de Ingesta Masiva (Bulk Import)</h3>
            <p style={styles.subtitle}>
              Carga masivamente cartas fundacionales, dominios o material homebrew en la base de datos H2.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLoadTemplate}
          style={styles.btnTemplate}
          title="Carga una estructura de ejemplo en el área de texto"
        >
          📋 Cargar Plantilla JSON
        </button>
      </div>

      {/* Alerta de Estado */}
      {alertInfo && (
        <div
          style={{
            ...styles.alertBanner,
            backgroundColor: alertInfo.type === 'success' ? '#14331a' : '#3d1212',
            borderColor: alertInfo.type === 'success' ? '#2e7d32' : '#8b1a1a',
            color: alertInfo.type === 'success' ? '#a5d6a7' : '#ffcdd2',
          }}
        >
          {alertInfo.message}
        </div>
      )}

      <form onSubmit={handleImportSubmit} style={styles.form}>
        {/* Opción A: Cargar Archivo .json */}
        <div style={styles.uploadArea}>
          <label style={styles.uploadLabel}>
            <span style={styles.uploadTitle}>📁 Opción A: Cargar archivo .json</span>
            <span style={styles.uploadDesc}>
              Selecciona un archivo JSON desde tu explorador de archivos
            </span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              style={styles.fileInput}
            />
          </label>
          {fileName && (
            <div style={styles.fileStatus}>
              Archivo cargado: <strong>{fileName}</strong>
            </div>
          )}
        </div>

        {/* Separador */}
        <div style={styles.separatorRow}>
          <div style={styles.separatorLine} />
          <span style={styles.separatorText}>O PEGA TU JSON DIRECTAMENTE</span>
          <div style={styles.separatorLine} />
        </div>

        {/* Opción B: Textarea con JSON Crudo */}
        <div style={styles.textareaGroup}>
          <div style={styles.textareaHeader}>
            <label style={styles.label}>📝 Opción B: Pegar JSON Crudo</label>
            {previewCount !== null && (
              <span style={styles.previewTag}>
                ✓ {previewCount} carta(s) detectada(s)
              </span>
            )}
          </div>
          <textarea
            rows={7}
            value={jsonText}
            onChange={handleTextChange}
            placeholder={`[\n  {\n    "titulo": "Flecha Arcana",\n    "tipo": "Dominio",\n    "nivel": 1,\n    "descripcion": "**Acción:** ..."\n  }\n]`}
            style={styles.textarea}
          />
        </div>

        {/* Botón de Enviar */}
        <button
          type="submit"
          disabled={isProcessing || !jsonText.trim()}
          style={
            isProcessing || !jsonText.trim()
              ? styles.btnSubmitDisabled
              : styles.btnSubmit
          }
        >
          {isProcessing
            ? '⏳ Procesando Ingesta en la Base de Datos...'
            : previewCount
            ? `🚀 Importar ${previewCount} Carta(s) a la Base de Datos`
            : '🚀 Iniciar Importación Masiva'}
        </button>
      </form>
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
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #3a2a1a',
    paddingBottom: '12px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    fontSize: '2rem',
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
  btnTemplate: {
    backgroundColor: '#241a0e',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
  },
  alertBanner: {
    border: '1px solid',
    borderRadius: '6px',
    padding: '12px 16px',
    fontSize: '0.9rem',
    fontWeight: '500',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  uploadArea: {
    border: '2px dashed #4a3728',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    backgroundColor: '#100a04',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  },
  uploadTitle: {
    color: '#d4af37',
    fontSize: '0.95rem',
    fontWeight: 'bold',
  },
  uploadDesc: {
    color: '#7a6a5a',
    fontSize: '0.78rem',
  },
  fileInput: {
    display: 'none',
  },
  fileStatus: {
    marginTop: '8px',
    color: '#a5d6a7',
    fontSize: '0.82rem',
  },
  separatorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  separatorLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#3a2a1a',
  },
  separatorText: {
    color: '#7a6a5a',
    fontSize: '0.72rem',
    letterSpacing: '1px',
    fontWeight: 'bold',
  },
  textareaGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  textareaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#a0906a',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  previewTag: {
    backgroundColor: '#1b3b22',
    color: '#a5d6a7',
    border: '1px solid #2e7d32',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  textarea: {
    backgroundColor: '#0d0905',
    color: '#e8dcc8',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    resize: 'vertical',
    lineHeight: '1.4',
  },
  btnSubmit: {
    backgroundColor: '#8b1a1a',
    color: '#f5e6d3',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 14px rgba(139, 26, 26, 0.4)',
    transition: 'background-color 0.15s ease',
  },
  btnSubmitDisabled: {
    backgroundColor: '#26160d',
    color: '#6a5040',
    border: '1px solid #3a2a1a',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '0.95rem',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
};
