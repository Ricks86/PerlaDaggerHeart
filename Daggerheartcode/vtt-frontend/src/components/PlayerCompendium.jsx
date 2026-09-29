import React, { useState, useEffect, useRef } from 'react';

/**
 * PlayerCompendium: Compendio de Héroes y Motor de Respaldo/Restauración JSON (Sprint 15).
 *
 * Permite al Dungeon Master:
 *  - Ver la lista completa de personajes guardados en la base de datos.
 *  - Exportar respaldos individuales en formato JSON (.json).
 *  - Restaurar personajes desde archivos JSON eliminando la propiedad 'id' para forzar creación limpia.
 *  - Eliminar personajes de forma permanente con confirmación estricta.
 */
export default function PlayerCompendium() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Carga inicial y refresco de personajes
  const loadCharacters = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/characters');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCharacters(data);
    } catch (err) {
      console.error('[PlayerCompendium] Error cargando personajes:', err);
      showFeedback('error', `Error al cargar héroes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, []);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // ===========================================================================
  // Fase 3: Motor de Respaldo (Exportar JSON)
  // ===========================================================================
  const handleExportBackup = (char) => {
    try {
      const blob = new Blob([JSON.stringify(char, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (char.nombre || 'personaje')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const fileName = `${safeName}_backup.json`;

      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showFeedback('success', `✓ Respaldo exportado: ${fileName}`);
    } catch (err) {
      console.error('[PlayerCompendium] Error exportando respaldo:', err);
      showFeedback('error', `Error al exportar: ${err.message}`);
    }
  };

  // ===========================================================================
  // Fase 2: Borrado Permanente de Personajes
  // ===========================================================================
  const handleDeleteCharacter = async (char) => {
    const confirmed = window.confirm(
      `¿Borrar este personaje permanentemente?\n\n"${char.nombre}" (Nv. ${char.nivel || 1} ${char.clase || ''}) será eliminado de la crónica para siempre.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/characters/${char.id}`, {
        method: 'DELETE',
      });

      if (!res.ok && res.status !== 204 && res.status !== 200) {
        throw new Error(`HTTP ${res.status}`);
      }

      showFeedback('success', `✓ Personaje "${char.nombre}" eliminado permanentemente`);
      loadCharacters();
    } catch (err) {
      console.error('[PlayerCompendium] Error eliminando personaje:', err);
      showFeedback('error', `Error al eliminar personaje: ${err.message}`);
    }
  };

  // ===========================================================================
  // Fase 4: Motor de Restauración (Importar JSON)
  // ===========================================================================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (!text) throw new Error('El archivo está vacío');

        const parsed = JSON.parse(text);

        // Puede ser un solo personaje o un array de personajes
        const charactersToImport = Array.isArray(parsed) ? parsed : [parsed];

        if (charactersToImport.length === 0) {
          throw new Error('No se encontraron personajes en el archivo JSON');
        }

        let importedCount = 0;
        let lastHeroName = '';

        for (const item of charactersToImport) {
          if (!item.nombre || !item.clase) {
            throw new Error('El JSON no tiene una estructura de personaje válida (requiere al menos "nombre" y "clase")');
          }

          // REGLA CRÍTICA: Eliminar la propiedad id del objeto JSON
          delete item.id;

          const res = await fetch('/api/characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });

          if (!res.ok) {
            throw new Error(`Fallo al guardar personaje (HTTP ${res.status})`);
          }

          const saved = await res.json();
          lastHeroName = saved.nombre;
          importedCount++;
        }

        const successMsg =
          importedCount === 1
            ? `✓ ¡Héroe "${lastHeroName}" restaurado con éxito desde el respaldo!`
            : `✓ ¡${importedCount} héroes restaurados con éxito desde el respaldo!`;

        showFeedback('success', successMsg);
        loadCharacters();
      } catch (err) {
        console.error('[PlayerCompendium] Error en importación:', err);
        showFeedback('error', `Error al restaurar respaldo: ${err.message}`);
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setImporting(false);
      showFeedback('error', 'Error de lectura de archivo en el navegador');
    };

    reader.readAsText(file);
  };

  // Filtrado de personajes por nombre o clase
  const filteredCharacters = characters.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.nombre && c.nombre.toLowerCase().includes(term)) ||
      (c.clase && c.clase.toLowerCase().includes(term)) ||
      (c.subclase && c.subclase.toLowerCase().includes(term))
    );
  });

  return (
    <div style={styles.container}>
      {/* ------------------------------------------------------------- */}
      {/* Banner de Feedback Temporal                                     */}
      {/* ------------------------------------------------------------- */}
      {feedback && (
        <div
          style={
            feedback.type === 'success'
              ? styles.feedbackSuccess
              : styles.feedbackError
          }
        >
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Fase 4: Área de Restauración desde Respaldo                    */}
      {/* ------------------------------------------------------------- */}
      <div style={styles.restoreBox}>
        <div style={styles.restoreHeader}>
          <div style={styles.restoreTitleBlock}>
            <span style={styles.restoreIcon}>📥</span>
            <div>
              <h4 style={styles.restoreTitle}>Restaurar Personaje desde Respaldo</h4>
              <p style={styles.restoreSubtitle}>
                Sube un archivo <code>.json</code> previamente exportado. El sistema purgará el ID original para generar un nuevo héroe limpio en la base de datos.
              </p>
            </div>
          </div>

          <div style={styles.restoreActionBlock}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="hero-backup-file-input"
              disabled={importing}
            />
            <label
              htmlFor="hero-backup-file-input"
              style={importing ? styles.uploadBtnDisabled : styles.uploadBtn}
            >
              {importing ? '⏳ Restaurando...' : '📁 Seleccionar Archivo .JSON'}
            </label>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Barra de Búsqueda y Estadísticas                              */}
      {/* ------------------------------------------------------------- */}
      <div style={styles.toolbarRow}>
        <div style={styles.toolbarLeft}>
          <span style={styles.toolbarTitle}>📜 Compendio de Héroes Activos</span>
          <span style={styles.counterBadge}>
            {characters.length} héroe(s) registrado(s)
          </span>
        </div>

        <div style={styles.toolbarRight}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o clase..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <button
            onClick={loadCharacters}
            style={styles.refreshBtn}
            title="Refrescar lista"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Fase 2: Tabla del Compendio de Héroes                         */}
      {/* ------------------------------------------------------------- */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>⏳ Cargando la crónica de héroes...</p>
          </div>
        ) : characters.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🛡️</span>
            <h4 style={styles.emptyTitle}>No hay personajes en la base de datos</h4>
            <p style={styles.emptyText}>
              La base de datos se encuentra purgada. Puedes restaurar un héroe desde un archivo de respaldo o forjar uno nuevo desde la vista del jugador.
            </p>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No se encontraron personajes que coincidan con "{searchTerm}"</p>
          </div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Clase / Subclase</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Nivel</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>HP Máximo</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Evasión</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Armadura</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Acciones de Respaldo</th>
                </tr>
              </thead>
              <tbody>
                {filteredCharacters.map((c) => {
                  const armadura = c.armaduraActiva;
                  const armorSlots = armadura ? armadura.puntuacionBase : 0;
                  const marcadas = c.ranurasArmaduraMarcadas || 0;

                  return (
                    <tr key={c.id} style={styles.tr}>
                      {/* Nombre */}
                      <td style={styles.td}>
                        <div style={styles.heroNameBlock}>
                          <strong style={styles.heroName}>{c.nombre}</strong>
                          {c.ancestro && (
                            <span style={styles.heroAncestry}>({c.ancestro})</span>
                          )}
                        </div>
                      </td>

                      {/* Clase / Subclase */}
                      <td style={styles.td}>
                        <div style={styles.classBlock}>
                          <span style={styles.classBadge}>{c.clase}</span>
                          {c.subclase && (
                            <span style={styles.subclassBadge}>{c.subclase}</span>
                          )}
                        </div>
                      </td>

                      {/* Nivel */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.levelTag}>Nv. {c.nivel || 1}</span>
                      </td>

                      {/* HP Máximo */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.hpVal}>
                          ❤️ {c.hpMax ?? c.hpActual ?? 6} HP
                        </span>
                      </td>

                      {/* Evasión */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.evasionVal}>
                          🛡️ {c.evasion ?? 10}
                        </span>
                      </td>

                      {/* Armadura */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.armorVal}>
                          🦺 {armorSlots} {marcadas > 0 ? `(${marcadas} gast.)` : ''}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={styles.actionsGroup}>
                          {/* Fase 3: Botón Exportar Backup */}
                          <button
                            onClick={() => handleExportBackup(c)}
                            style={styles.btnExport}
                            title={`Descargar archivo JSON de respaldo para ${c.nombre}`}
                          >
                            💾 Exportar Backup
                          </button>

                          {/* Fase 2: Botón Eliminar (Rojo) */}
                          <button
                            onClick={() => handleDeleteCharacter(c)}
                            style={styles.btnDelete}
                            title={`Eliminar permanentemente a ${c.nombre} de la base de datos`}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
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
// Estilos Dark Fantasy
// =============================================================================
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    color: '#e8dcc8',
  },

  // Banners de feedback
  feedbackSuccess: {
    backgroundColor: '#1b2a1a',
    border: '1px solid #4caf50',
    color: '#a3e4a3',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.2)',
  },
  feedbackError: {
    backgroundColor: '#2e120e',
    border: '1px solid #8b1a1a',
    color: '#f5a698',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(139, 26, 26, 0.2)',
  },

  // Área de Restauración (Fase 4)
  restoreBox: {
    backgroundColor: '#170f07',
    border: '1px solid #4a3728',
    borderRadius: '8px',
    padding: '14px 18px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  restoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '14px',
  },
  restoreTitleBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: '1 1 360px',
  },
  restoreIcon: {
    fontSize: '1.8rem',
  },
  restoreTitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1.1rem',
    letterSpacing: '0.5px',
  },
  restoreSubtitle: {
    margin: '3px 0 0 0',
    color: '#8f7e6c',
    fontSize: '0.8rem',
    lineHeight: 1.35,
  },
  restoreActionBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  uploadBtn: {
    backgroundColor: '#2e1f0e',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '9px 16px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.5px',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  uploadBtnDisabled: {
    backgroundColor: '#1a120a',
    color: '#6e5a47',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    padding: '9px 16px',
    fontSize: '0.85rem',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },

  // Barra de herramientas / Búsqueda
  toolbarRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  toolbarTitle: {
    fontSize: '1.05rem',
    fontWeight: 'bold',
    color: '#d4af37',
  },
  counterBadge: {
    backgroundColor: '#241a0e',
    color: '#a0906a',
    border: '1px solid #4a3728',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  searchInput: {
    backgroundColor: '#150e06',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    color: '#e8dcc8',
    padding: '7px 12px',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    width: '240px',
    outline: 'none',
  },
  refreshBtn: {
    backgroundColor: '#241a0e',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    color: '#d4af37',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },

  // Tabla
  tableCard: {
    backgroundColor: '#150e06',
    border: '1px solid #4a3728',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.88rem',
  },
  theadRow: {
    backgroundColor: '#1f1308',
    borderBottom: '2px solid #4a3728',
  },
  th: {
    padding: '12px 14px',
    color: '#a0906a',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #291a0e',
    transition: 'background-color 0.15s ease',
  },
  td: {
    padding: '12px 14px',
    verticalAlign: 'middle',
  },

  // Celdas específicas
  heroNameBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  heroName: {
    color: '#f5e6d3',
    fontSize: '0.95rem',
    letterSpacing: '0.3px',
  },
  heroAncestry: {
    color: '#8a7764',
    fontSize: '0.75rem',
    fontStyle: 'italic',
  },
  classBlock: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  classBadge: {
    backgroundColor: '#24170a',
    color: '#d4af37',
    border: '1px solid #5a3c1e',
    borderRadius: '4px',
    padding: '2px 7px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  subclassBadge: {
    backgroundColor: '#1a1209',
    color: '#a0906a',
    border: '1px solid #3d2a17',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '0.72rem',
  },
  levelTag: {
    backgroundColor: '#8b1a1a',
    color: '#f5e6d3',
    border: '1px solid #d4af37',
    borderRadius: '3px',
    padding: '2px 6px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  hpVal: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: '0.85rem',
  },
  evasionVal: {
    color: '#557a9e',
    fontWeight: 'bold',
    fontSize: '0.85rem',
  },
  armorVal: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: '0.85rem',
  },

  // Grupo de Acciones
  actionsGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  btnExport: {
    backgroundColor: '#1e160a',
    color: '#d4af37',
    border: '1px solid #5a4220',
    borderRadius: '4px',
    padding: '6px 11px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  },
  btnDelete: {
    backgroundColor: '#4a110a',
    color: '#ff9a85',
    border: '1px solid #8b1a1a',
    borderRadius: '4px',
    padding: '6px 11px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  },

  // Estados vacíos
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    opacity: 0.4,
  },
  emptyTitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1.1rem',
  },
  emptyText: {
    margin: 0,
    color: '#7a6a5a',
    fontSize: '0.88rem',
    maxWidth: '460px',
    lineHeight: 1.4,
  },
};
