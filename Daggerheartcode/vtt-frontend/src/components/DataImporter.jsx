import React, { useState } from 'react';

/**
 * DataImporter: Motor de Ingesta Masiva (Bulk / Batch Import) para el Dungeon Master.
 *
 * Permite cargar un archivo .json o pegar texto plano para insertar
 * masivamente cartas fundacionales (/api/cards/batch) u objetos polimórficos (/api/items/batch)
 * en la base de datos de una sola vez.
 *
 * @param {Function} onImportSuccess - Callback para refrescar vistas o compendios tras el éxito.
 */
export default function DataImporter({ onImportSuccess }) {
  const [importTarget, setImportTarget] = useState('CARDS'); // 'CARDS' | 'ITEMS'
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); // { type: 'success' | 'error', message: string, count?: number }
  const [previewCount, setPreviewCount] = useState(null);

  // Manejar cambio de tipo de ingesta (Cartas vs Objetos)
  function handleSwitchTarget(target) {
    setImportTarget(target);
    setAlertInfo(null);
    setJsonText('');
    setFileName('');
    setPreviewCount(null);
  }

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
        tryPreParse(content, importTarget);
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

  // Pre-analizar texto para dar feedback rápido de elementos detectados
  function tryPreParse(text, target = importTarget) {
    if (!text.trim()) {
      setPreviewCount(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (target === 'CARDS') {
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.cards)
          ? parsed.cards
          : [parsed];
        setPreviewCount(list.length);
      } else {
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.items)
          ? parsed.items
          : [parsed];
        setPreviewCount(list.length);
      }
    } catch {
      setPreviewCount(null);
    }
  }

  // Manejar cambio manual en el textarea
  function handleTextChange(e) {
    const val = e.target.value;
    setJsonText(val);
    setAlertInfo(null);
    tryPreParse(val, importTarget);
  }

  // Enviar el lote a /api/cards/batch o /api/items/batch
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

    if (importTarget === 'CARDS') {
      importCards(parsed);
    } else {
      importItems(parsed);
    }
  }

  // Lógica de importación para Cartas
  function importCards(parsed) {
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

    fetch('/api/cards/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedCards),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const count = data.count || (Array.isArray(data) ? data.length : sanitizedCards.length);
        setAlertInfo({
          type: 'success',
          message: `✓ ¡Ingesta Masiva Exitosa! Se han insertado ${count} carta(s) en el compendio.`,
          count,
        });

        setJsonText('');
        setFileName('');
        setPreviewCount(null);

        if (onImportSuccess) onImportSuccess();
      })
      .catch((err) => {
        console.error('[BulkImport Cards] Error:', err);
        setAlertInfo({
          type: 'error',
          message: `Error al comunicar con el servidor: ${err.message}`,
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }

  // Lógica de importación para Objetos (Items polimórficos)
  function importItems(parsed) {
    let itemsArray = [];
    if (Array.isArray(parsed)) {
      itemsArray = parsed;
    } else if (Array.isArray(parsed.items)) {
      itemsArray = parsed.items;
    } else if (typeof parsed === 'object' && parsed !== null) {
      itemsArray = [parsed];
    } else {
      setIsProcessing(false);
      setAlertInfo({
        type: 'error',
        message: 'El formato del JSON debe ser una lista de ítems o un objeto con propiedad "items".',
      });
      return;
    }

    if (itemsArray.length === 0) {
      setIsProcessing(false);
      setAlertInfo({
        type: 'error',
        message: 'No se encontraron objetos para importar en el JSON proporcionado.',
      });
      return;
    }

    // Asegurar que no se fuercen IDs que puedan colisionar
    const sanitizedItems = itemsArray.map((it) => {
      const copy = { ...it };
      delete copy.id;
      return copy;
    });

    fetch('/api/items/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedItems),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const count = Array.isArray(data) ? data.length : sanitizedItems.length;
        setAlertInfo({
          type: 'success',
          message: `✓ ¡Ingesta Masiva Exitosa! Se han insertado ${count} objeto(s) (armas, armaduras y consumibles) en el catálogo.`,
          count,
        });

        setJsonText('');
        setFileName('');
        setPreviewCount(null);

        if (onImportSuccess) onImportSuccess();
      })
      .catch((err) => {
        console.error('[BatchImport Items] Error:', err);
        setAlertInfo({
          type: 'error',
          message: `Error al comunicar con el servidor: ${err.message}`,
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }

  // Cargar plantilla JSON adaptativa
  function handleLoadTemplate() {
    if (importTarget === 'CARDS') {
      const template = [
        {
          titulo: "Flecha de Tormenta",
          tipo: "Dominio",
          nivel: 1,
          descripcion: "**Acción:** Gasta **1 Esperanza** para disparar una flecha cargada de electricidad. Inflige **daño mágico** y deja al objetivo **Marcado**.",
          metadata: null,
        },
        {
          titulo: "Pícaro",
          tipo: "Clase",
          nivel: 1,
          descripcion: "**Habilidad de Clase:** Especialista en emboscadas y sigilo.",
          metadata: {
            evasion_base: 10,
            hp_inicial: 6,
            dominios: ["Gracia", "Medianoche"]
          },
        },
      ];
      const str = JSON.stringify(template, null, 2);
      setJsonText(str);
      tryPreParse(str, 'CARDS');
    } else {
      const template = [
        {
          nombre: "Espada de Acero Templado",
          tier: 1,
          categoria: "Principal",
          rasgo: "Equilibrada",
          dadoBase: "d8",
          modificadorDano: 2,
          tipoDano: "físico",
          carga: 1,
          alcance: "Cuerpo a cuerpo"
        },
        {
          nombre: "Cota de Malla Reforzada",
          tier: 1,
          puntuacionBase: 5,
          umbralMayorBase: 8,
          umbralGraveBase: 15,
          rasgoEspecial: "-1 a Evasión"
        },
        {
          nombre: "Poción de Regeneración",
          tier: 1,
          descripcion: "Restaura 3 Puntos de Golpe (HP) y despeja 1 de Estrés."
        }
      ];
      const str = JSON.stringify(template, null, 2);
      setJsonText(str);
      tryPreParse(str, 'ITEMS');
    }
    setAlertInfo(null);
  }

  return (
    <div style={styles.container}>
      {/* Cabecera del Importador */}
      <div style={styles.header}>
        <div style={styles.headerTitleGroup}>
          <span style={styles.icon}>📥</span>
          <div>
            <h3 style={styles.title}>Motor de Ingesta Masiva (Bulk / Batch Import)</h3>
            <p style={styles.subtitle}>
              Carga masivamente cartas fundacionales o catálogo de objetos polimórficos en la base de datos.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLoadTemplate}
          style={styles.btnTemplate}
          title="Carga una estructura de ejemplo en el área de texto"
        >
          📋 Cargar Plantilla JSON ({importTarget === 'CARDS' ? 'Cartas' : 'Objetos'})
        </button>
      </div>

      {/* Selector de Destino de Ingesta (Sprint 16) */}
      <div style={styles.targetSelectorRow}>
        <span style={styles.selectorLabel}>Destino de Ingesta:</span>
        <div style={styles.radioGroup}>
          <button
            type="button"
            onClick={() => handleSwitchTarget('CARDS')}
            style={importTarget === 'CARDS' ? styles.tabChoiceActive : styles.tabChoice}
          >
            📜 Compendio de Cartas (/api/cards/batch)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTarget('ITEMS')}
            style={importTarget === 'ITEMS' ? styles.tabChoiceActive : styles.tabChoice}
          >
            ⚔️ Catálogo de Objetos (/api/items/batch)
          </button>
        </div>
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
            <span style={styles.uploadTitle}>
              📁 Opción A: Cargar archivo .json ({importTarget === 'CARDS' ? 'Cartas' : 'Objetos'})
            </span>
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
            <label style={styles.label}>
              📝 Opción B: Pegar JSON Crudo ({importTarget === 'CARDS' ? 'Cartas' : 'Objetos'})
            </label>
            {previewCount !== null && (
              <span style={styles.previewTag}>
                ✓ {previewCount} {importTarget === 'CARDS' ? 'carta(s)' : 'objeto(s)'} detectado(s)
              </span>
            )}
          </div>
          <textarea
            rows={8}
            value={jsonText}
            onChange={handleTextChange}
            placeholder={
              importTarget === 'CARDS'
                ? `[\n  {\n    "titulo": "Flecha Arcana",\n    "tipo": "Dominio",\n    "nivel": 1,\n    "descripcion": "**Acción:** ..."\n  }\n]`
                : `[\n  {\n    "nombre": "Espada de Acero",\n    "tier": 1,\n    "categoria": "Principal",\n    "dadoBase": "d8",\n    "tipoDano": "físico"\n  }\n]`
            }
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
            ? `🚀 Importar ${previewCount} ${importTarget === 'CARDS' ? 'Carta(s)' : 'Objeto(s)'} a la Base de Datos`
            : '🚀 Iniciar Ingesta Masiva'}
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
  targetSelectorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: '#100a04',
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #3a2a1a',
    flexWrap: 'wrap',
  },
  selectorLabel: {
    color: '#d4af37',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  radioGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  tabChoice: {
    backgroundColor: '#1c1309',
    color: '#a0906a',
    border: '1px solid #4a3728',
    borderRadius: '5px',
    padding: '6px 12px',
    fontSize: '0.82rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  tabChoiceActive: {
    backgroundColor: '#8b1a1a',
    color: '#f5e6d3',
    border: '1px solid #d4af37',
    borderRadius: '5px',
    padding: '6px 12px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(139, 26, 26, 0.4)',
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
