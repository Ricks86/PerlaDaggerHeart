import React, { useState, useEffect } from 'react';

/**
 * ItemForge: Herramienta del Dungeon Master para crear y catalogar
 * objetos polimórficos (Armas, Armaduras, Consumibles) en la base de datos.
 */
export default function ItemForge() {
  const [tipo, setTipo] = useState('Arma'); // 'Arma' | 'Armadura' | 'Consumible'
  const [nombre, setNombre] = useState('');
  const [tier, setTier] = useState(1);

  // Campos específicos de Arma
  const [categoria, setCategoria] = useState('Principal');
  const [rasgo, setRasgo] = useState('');
  const [dadoBase, setDadoBase] = useState('d8');
  const [modificadorDano, setModificadorDano] = useState(0);
  const [tipoDano, setTipoDano] = useState('físico');
  const [carga, setCarga] = useState(1);
  const [alcance, setAlcance] = useState('Cuerpo a cuerpo');

  // Campos específicos de Armadura
  const [puntuacionBase, setPuntuacionBase] = useState(4);
  const [umbralMayorBase, setUmbralMayorBase] = useState(7);
  const [umbralGraveBase, setUmbralGraveBase] = useState(14);
  const [rasgoEspecial, setRasgoEspecial] = useState('');

  // Campos específicos de Consumible
  const [descripcion, setDescripcion] = useState('');

  // Estado del catálogo y feedback
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Cargar catálogo existente
  const loadItems = () => {
    setLoading(true);
    fetch('/api/items')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[ItemForge] Error al cargar ítems:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadItems();
  }, []);

  const resetForm = () => {
    setNombre('');
    setTier(1);
    // Arma
    setCategoria('Principal');
    setRasgo('');
    setDadoBase('d8');
    setModificadorDano(0);
    setTipoDano('físico');
    setCarga(1);
    setAlcance('Cuerpo a cuerpo');
    // Armadura
    setPuntuacionBase(4);
    setUmbralMayorBase(7);
    setUmbralGraveBase(14);
    setRasgoEspecial('');
    // Consumible
    setDescripcion('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setFeedback({ type: 'error', message: 'El nombre del objeto es obligatorio.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    // Construcción del payload respetando la herencia de clases (polimorfismo)
    let payload = {
      tipo,
      nombre: nombre.trim(),
      tier: parseInt(tier, 10) || 1,
    };

    if (tipo === 'Arma') {
      payload = {
        ...payload,
        categoria,
        rasgo: rasgo.trim(),
        dadoBase,
        modificadorDano: parseInt(modificadorDano, 10) || 0,
        tipoDano,
        carga: parseInt(carga, 10) || 1,
        alcance,
      };
    } else if (tipo === 'Armadura') {
      payload = {
        ...payload,
        puntuacionBase: parseInt(puntuacionBase, 10) || 0,
        umbralMayorBase: parseInt(umbralMayorBase, 10) || 0,
        umbralGraveBase: parseInt(umbralGraveBase, 10) || 0,
        rasgoEspecial: rasgoEspecial.trim(),
      };
    } else if (tipo === 'Consumible') {
      payload = {
        ...payload,
        descripcion: descripcion.trim(),
      };
    }

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = await res.json();

      setFeedback({
        type: 'success',
        message: `✓ ¡"${saved.nombre}" forjado con éxito como ${saved.tipo}!`,
      });
      resetForm();
      loadItems();
    } catch (err) {
      console.error('[ItemForge] Error al crear ítem:', err);
      setFeedback({
        type: 'error',
        message: `⚠️ Error al crear objeto: ${err.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, itemNombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${itemNombre}"?`)) return;

    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        setFeedback({ type: 'success', message: `✓ "${itemNombre}" eliminado.` });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error('[ItemForge] Error al eliminar ítem:', err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Encabezado de la forja */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>🛠️ La Forja de Objetos</h3>
          <p style={styles.subtitle}>
            Crea armas, armaduras y consumibles en la base de datos con herencia polimórfica.
          </p>
        </div>
        <button onClick={loadItems} style={styles.btnRefresh} title="Actualizar catálogo">
          🔄 Recargar
        </button>
      </div>

      {feedback && (
        <div
          style={
            feedback.type === 'success'
              ? styles.feedbackSuccess
              : styles.feedbackError
          }
        >
          {feedback.message}
        </div>
      )}

      {/* Formulario de Creación */}
      <form onSubmit={handleSubmit} style={styles.formCard}>
        {/* Selector de tipo principal */}
        <div style={styles.formRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tipo de Objeto:</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={styles.selectType}
            >
              <option value="Arma">⚔️ Arma</option>
              <option value="Armadura">🛡️ Armadura</option>
              <option value="Consumible">🧪 Consumible</option>
            </select>
          </div>

          <div style={{ ...styles.inputGroup, flex: 2 }}>
            <label style={styles.label}>Nombre del Objeto:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Espada Rúnica, Cota de Malla, Elixir de Vida..."
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Tier (1 al 4):</label>
            <select
              value={tier}
              onChange={(e) => setTier(parseInt(e.target.value, 10))}
              style={styles.select}
            >
              <option value={1}>Tier 1 (Inicial)</option>
              <option value={2}>Tier 2 (Aventurero)</option>
              <option value={3}>Tier 3 (Héroe)</option>
              <option value={4}>Tier 4 (Legendario)</option>
            </select>
          </div>
        </div>

        {/* =============================================================== */}
        {/* CAMPOS CONDICIONALES: ARMA                                       */}
        {/* =============================================================== */}
        {tipo === 'Arma' && (
          <div style={styles.conditionalBlock}>
            <span style={styles.blockTitle}>⚔️ Atributos del Arma</span>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Categoría:</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  style={styles.select}
                >
                  <option value="Principal">Principal (Mano hábil)</option>
                  <option value="Secundaria">Secundaria (Mano torpe)</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Carga (Manos):</label>
                <select
                  value={carga}
                  onChange={(e) => setCarga(parseInt(e.target.value, 10))}
                  style={styles.select}
                >
                  <option value={1}>1 Mano (Carga 1)</option>
                  <option value={2}>2 Manos (Carga 2)</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Dado Base:</label>
                <select
                  value={dadoBase}
                  onChange={(e) => setDadoBase(e.target.value)}
                  style={styles.select}
                >
                  <option value="d4">d4</option>
                  <option value="d6">d6</option>
                  <option value="d8">d8</option>
                  <option value="d10">d10</option>
                  <option value="d12">d12</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Modificador de Daño:</label>
                <input
                  type="number"
                  value={modificadorDano}
                  onChange={(e) => setModificadorDano(e.target.value)}
                  style={styles.input}
                  placeholder="0"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Tipo de Daño:</label>
                <select
                  value={tipoDano}
                  onChange={(e) => setTipoDano(e.target.value)}
                  style={styles.select}
                >
                  <option value="físico">Físico</option>
                  <option value="mágico">Mágico</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Alcance:</label>
                <select
                  value={alcance}
                  onChange={(e) => setAlcance(e.target.value)}
                  style={styles.select}
                >
                  <option value="Cuerpo a cuerpo">Cuerpo a cuerpo</option>
                  <option value="Muy cercano">Muy cercano</option>
                  <option value="Cercano">Cercano</option>
                  <option value="Lejano">Lejano</option>
                  <option value="Muy lejano">Muy lejano</option>
                </select>
              </div>

              <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Rasgo (opcional):</label>
                <input
                  type="text"
                  value={rasgo}
                  onChange={(e) => setRasgo(e.target.value)}
                  placeholder="Ej. Ágil, Preciso, Devastador..."
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* CAMPOS CONDICIONALES: ARMADURA                                   */}
        {/* =============================================================== */}
        {tipo === 'Armadura' && (
          <div style={styles.conditionalBlock}>
            <span style={styles.blockTitle}>🛡️ Atributos de la Armadura</span>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Puntuación Base (Armor Slots):</label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={puntuacionBase}
                  onChange={(e) => setPuntuacionBase(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Umbral Mayor Base:</label>
                <input
                  type="number"
                  min="1"
                  value={umbralMayorBase}
                  onChange={(e) => setUmbralMayorBase(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Umbral Grave Base:</label>
                <input
                  type="number"
                  min="1"
                  value={umbralGraveBase}
                  onChange={(e) => setUmbralGraveBase(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={{ ...styles.inputGroup, gridColumn: 'span 3' }}>
                <label style={styles.label}>Rasgo Especial / Efecto (opcional):</label>
                <input
                  type="text"
                  value={rasgoEspecial}
                  onChange={(e) => setRasgoEspecial(e.target.value)}
                  placeholder="Ej. -1 a Evasión, +1 a Evasión en bosques..."
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* CAMPOS CONDICIONALES: CONSUMIBLE                                 */}
        {/* =============================================================== */}
        {tipo === 'Consumible' && (
          <div style={styles.conditionalBlock}>
            <span style={styles.blockTitle}>🧪 Atributos del Consumible</span>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Descripción y Efecto:</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Efecto al usarse (ej. Restaura 2 HP, despeja 1 punto de Estrés, otorga Ventaja en la siguiente tirada...)"
                rows={3}
                style={styles.textarea}
                required
              />
            </div>
          </div>
        )}

        {/* Botón de Enviar */}
        <div style={styles.formActions}>
          <button
            type="submit"
            disabled={submitting}
            style={submitting ? styles.btnSubmitDisabled : styles.btnSubmit}
          >
            {submitting ? '⏳ Forjando objeto...' : `✨ Forjar ${tipo}`}
          </button>
        </div>
      </form>

      {/* =============================================================== */}
      {/* TABLA DE ÍTEMS EN BASE DE DATOS                                 */}
      {/* =============================================================== */}
      <div style={styles.catalogCard}>
        <div style={styles.catalogHeader}>
          <h4 style={styles.catalogTitle}>📦 Catálogo Actual de Ítems ({items.length})</h4>
          <span style={styles.catalogHint}>Objetos almacenados en la base de datos</span>
        </div>

        {loading ? (
          <p style={styles.loadingText}>Cargando ítems...</p>
        ) : items.length === 0 ? (
          <p style={styles.emptyText}>No hay objetos registrados aún en la base de datos.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Tier</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Propiedades Clave</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} style={styles.tr}>
                    <td style={styles.tdId}>#{it.id}</td>
                    <td style={styles.td}>
                      <span
                        style={
                          it.tipo === 'Arma'
                            ? styles.badgeWeapon
                            : it.tipo === 'Armadura'
                            ? styles.badgeArmor
                            : styles.badgeConsumable
                        }
                      >
                        {it.tipo}
                      </span>
                    </td>
                    <td style={styles.td}>T{it.tier}</td>
                    <td style={styles.tdName}>
                      <strong>{it.nombre}</strong>
                    </td>
                    <td style={styles.tdProps}>
                      {it.tipo === 'Arma' && (
                        <span>
                          [{it.categoria || 'Principal'} - {it.carga || 1}M] 🎲 {it.dadoBase}
                          {it.modificadorDano >= 0 ? `+${it.modificadorDano}` : it.modificadorDano} {it.tipoDano}
                          {it.alcance ? ` • ${it.alcance}` : ''}
                          {it.rasgo ? ` (${it.rasgo})` : ''}
                        </span>
                      )}
                      {it.tipo === 'Armadura' && (
                        <span>
                          Ranuras: {it.puntuacionBase} • Umbrales: {it.umbralMayorBase}/{it.umbralGraveBase}
                          {it.rasgoEspecial ? ` • "${it.rasgoEspecial}"` : ''}
                        </span>
                      )}
                      {it.tipo === 'Consumible' && (
                        <span style={{ fontStyle: 'italic', color: '#c4b59d' }}>
                          {it.descripcion}
                        </span>
                      )}
                    </td>
                    <td style={styles.tdAction}>
                      <button
                        onClick={() => handleDelete(it.id, it.nombre)}
                        style={styles.btnDelete}
                        title="Eliminar ítem"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #3d2c1d',
    paddingBottom: '10px',
  },
  title: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1.3rem',
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: '#7a6a5a',
    fontSize: '0.85rem',
  },
  btnRefresh: {
    backgroundColor: '#241a0e',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  feedbackSuccess: {
    backgroundColor: '#1b2a1a',
    color: '#7cd37c',
    border: '1px solid #3d6a3d',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  feedbackError: {
    backgroundColor: '#3a1a15',
    color: '#ff8585',
    border: '1px solid #7a2b20',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: '#150f07',
    border: '1px solid #4a3728',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    minWidth: '140px',
  },
  label: {
    color: '#a08575',
    fontSize: '0.78rem',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#0a0704',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    color: '#e8dcc8',
    padding: '7px 10px',
    fontSize: '0.85rem',
    outline: 'none',
  },
  select: {
    backgroundColor: '#0a0704',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    color: '#e8dcc8',
    padding: '7px 10px',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
  },
  selectType: {
    backgroundColor: '#241a0e',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    color: '#d4af37',
    padding: '7px 10px',
    fontSize: '0.88rem',
    fontWeight: 'bold',
    outline: 'none',
    cursor: 'pointer',
  },
  textarea: {
    backgroundColor: '#0a0704',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    color: '#e8dcc8',
    padding: '8px 10px',
    fontSize: '0.85rem',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  conditionalBlock: {
    backgroundColor: '#1c140b',
    border: '1px solid #332317',
    borderRadius: '6px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  blockTitle: {
    color: '#d4af37',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    borderBottom: '1px solid #2a1e12',
    paddingBottom: '4px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    borderTop: '1px solid #2a1e12',
    paddingTop: '10px',
  },
  btnSubmit: {
    backgroundColor: '#8b1a1a',
    color: '#f5e6c8',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '8px 20px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
  },
  btnSubmitDisabled: {
    backgroundColor: '#3a201c',
    color: '#7a5a54',
    border: '1px solid #5a3028',
    borderRadius: '6px',
    padding: '8px 20px',
    fontSize: '0.9rem',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
  catalogCard: {
    backgroundColor: '#150f07',
    border: '1px solid #4a3728',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  catalogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #2a1e12',
    paddingBottom: '6px',
  },
  catalogTitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1rem',
  },
  catalogHint: {
    color: '#7a6a5a',
    fontSize: '0.75rem',
  },
  loadingText: {
    color: '#7a6a5a',
    fontStyle: 'italic',
    fontSize: '0.85rem',
    margin: '10px 0',
  },
  emptyText: {
    color: '#7a6a5a',
    fontStyle: 'italic',
    fontSize: '0.85rem',
    margin: '10px 0',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.82rem',
  },
  thRow: {
    backgroundColor: '#20160d',
    borderBottom: '1px solid #4a3728',
  },
  th: {
    color: '#a08575',
    textAlign: 'left',
    padding: '8px 10px',
    fontWeight: 'bold',
    fontSize: '0.75rem',
  },
  tr: {
    borderBottom: '1px solid #22160d',
  },
  tdId: {
    color: '#7a6a5a',
    padding: '6px 10px',
    fontSize: '0.75rem',
  },
  td: {
    color: '#e8dcc8',
    padding: '6px 10px',
  },
  tdName: {
    color: '#f5e6c8',
    padding: '6px 10px',
  },
  tdProps: {
    color: '#b0a08e',
    padding: '6px 10px',
    fontSize: '0.78rem',
  },
  tdAction: {
    padding: '6px 10px',
    textAlign: 'center',
  },
  badgeWeapon: {
    backgroundColor: '#3a1a15',
    color: '#ff9a85',
    border: '1px solid #7a2b20',
    borderRadius: '3px',
    padding: '2px 5px',
    fontSize: '0.68rem',
    fontWeight: 'bold',
  },
  badgeArmor: {
    backgroundColor: '#1b2a3a',
    color: '#85c2ff',
    border: '1px solid #204b7a',
    borderRadius: '3px',
    padding: '2px 5px',
    fontSize: '0.68rem',
    fontWeight: 'bold',
  },
  badgeConsumable: {
    backgroundColor: '#1b2a1a',
    color: '#7cd37c',
    border: '1px solid #3d6a3d',
    borderRadius: '3px',
    padding: '2px 5px',
    fontSize: '0.68rem',
    fontWeight: 'bold',
  },
  btnDelete: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '2px 4px',
    opacity: 0.7,
    transition: 'opacity 0.15s ease',
  },
};
