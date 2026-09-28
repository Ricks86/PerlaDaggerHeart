import React, { useState } from 'react';
import { useDm } from '../context/DmContext';

// =============================================================================
// Subcomponente: Mini Rastreador de Casillas Manuales
// =============================================================================
function MiniTracker({ label, current, max, color, onToggleSlot }) {
  return (
    <div style={styles.trackerContainer}>
      <div style={styles.trackerHeader}>
        <span style={{ ...styles.trackerLabel, color }}>{label}</span>
        <span style={styles.trackerCounter}>{current}/{max}</span>
      </div>
      <div style={styles.trackerSlots}>
        {Array.from({ length: max }).map((_, idx) => {
          const isFilled = idx < current;
          return (
            <div
              key={idx}
              onClick={() => onToggleSlot(idx, isFilled)}
              title={`Casilla ${idx + 1} (${isFilled ? 'Marcada' : 'Vacía'})`}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: `2px solid ${color}`,
                backgroundColor: isFilled ? color : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Componente Principal: NpcManager
// =============================================================================

export default function NpcManager() {
  const {
    activeEncounter,
    selectedAdversary,
    dbPresets,
    addAdversary,
    removeAdversary,
    selectAdversary,
    updateAdversaryHp,
    updateAdversaryStress,
  } = useDm();

  // Estado del formulario
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    rango: 'Estándar',
    dificultad: 'Moderado',
    umbralMayor: 8,
    umbralGrave: 15,
    hpMax: 4,
    estresMax: 3,
    modificadorAtaque: 2,
    danoEstandar: '1d8+2',
  });

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    addAdversary(formData);
    // Reiniciar parcialmente para la siguiente creación
    setFormData((prev) => ({
      ...prev,
      nombre: '',
    }));
    setShowForm(false);
  }

  function handleQuickSpawn(preset) {
    addAdversary({
      nombre: preset.nombre,
      rango: preset.rango,
      dificultad: preset.dificultad,
      umbralMayor: preset.umbralMayor,
      umbralGrave: preset.umbralGrave,
      hpMax: preset.hp,
      estresMax: preset.estres || 3,
      modificadorAtaque: preset.modificadorAtaque,
      danoEstandar: preset.danoEstandar,
    });
  }

  return (
    <div style={styles.container}>
      {/* Cabecera del Gestor */}
      <div style={styles.header}>
        <div style={styles.headerTitleRow}>
          <h3 style={styles.title}>💀 Encuentro de Adversarios</h3>
          <span style={styles.countBadge}>{activeEncounter.length} en escena</span>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => setShowForm((v) => !v)}
            style={showForm ? styles.btnCancel : styles.btnAdd}
          >
            {showForm ? '✕ Cerrar' : '+ Crear Adversario'}
          </button>
        </div>
      </div>

      {/* Botones de Presets Rápidos si existen en la BD */}
      {dbPresets.length > 0 && (
        <div style={styles.presetBar}>
          <span style={styles.presetLabel}>Añadir rápido desde BD:</span>
          {dbPresets.map((p) => (
            <button
              key={p.id}
              onClick={() => handleQuickSpawn(p)}
              style={styles.presetBtn}
              title={`Invocar ${p.nombre} (${p.danoEstandar})`}
            >
              + {p.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Formulario rápido para instanciar adversarios */}
      {showForm && (
        <form onSubmit={handleCreate} style={styles.form}>
          <h4 style={styles.formTitle}>Nuevo Adversario / Monstruo</h4>

          <div style={styles.formGrid}>
            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Nombre:</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Ej. Líder Bandido, Trasgo Arquero..."
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Rango:</label>
              <select
                value={formData.rango}
                onChange={(e) => handleChange('rango', e.target.value)}
                style={styles.select}
              >
                <option value="Menor">Menor</option>
                <option value="Estándar">Estándar</option>
                <option value="Mayor">Mayor</option>
                <option value="Épico">Épico</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Dificultad:</label>
              <select
                value={formData.dificultad}
                onChange={(e) => handleChange('dificultad', e.target.value)}
                style={styles.select}
              >
                <option value="Fácil">Fácil</option>
                <option value="Moderado">Moderado</option>
                <option value="Difícil">Difícil</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>HP Máximo:</label>
              <input
                type="number"
                min="1"
                value={formData.hpMax}
                onChange={(e) => handleChange('hpMax', e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Estrés Máximo:</label>
              <input
                type="number"
                min="0"
                value={formData.estresMax}
                onChange={(e) => handleChange('estresMax', e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Umbral Mayor:</label>
              <input
                type="number"
                value={formData.umbralMayor}
                onChange={(e) => handleChange('umbralMayor', e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Umbral Grave:</label>
              <input
                type="number"
                value={formData.umbralGrave}
                onChange={(e) => handleChange('umbralGrave', e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Mod. Ataque:</label>
              <input
                type="number"
                value={formData.modificadorAtaque}
                onChange={(e) => handleChange('modificadorAtaque', e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Daño Estándar:</label>
              <input
                type="text"
                value={formData.danoEstandar}
                onChange={(e) => handleChange('danoEstandar', e.target.value)}
                placeholder="2d8+3"
                style={styles.input}
              />
            </div>
          </div>

          <button type="submit" style={styles.btnSubmit}>
            ⚔️ Añadir al Encuentro
          </button>
        </form>
      )}

      {/* Lista visual de adversarios en escena */}
      <div style={styles.encounterList}>
        {activeEncounter.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>
              No hay adversarios en el encuentro. Usa el botón superior o los presets para invocar enemigos.
            </p>
          </div>
        ) : (
          activeEncounter.map((adv) => {
            const isSelected = selectedAdversary?.instanceId === adv.instanceId;

            return (
              <div
                key={adv.instanceId}
                style={{
                  ...styles.card,
                  borderColor: isSelected ? '#d4af37' : '#4a3728',
                  boxShadow: isSelected ? '0 0 14px rgba(212, 175, 55, 0.25)' : 'none',
                  backgroundColor: isSelected ? '#22160a' : '#1a1208',
                }}
              >
                {/* Cabecera del monstruo */}
                <div style={styles.cardHeader}>
                  <div>
                    <h4 style={styles.advName}>
                      {adv.nombre}
                      {isSelected && <span style={styles.activeTag}>ACTIVO</span>}
                    </h4>
                    <div style={styles.badgesRow}>
                      <span style={styles.rankBadge}>{adv.rango}</span>
                      <span style={styles.diffBadge}>{adv.dificultad}</span>
                      <span style={styles.statChip}>Atk: +{adv.modificadorAtaque}</span>
                      <span style={styles.statChip}>Daño: {adv.danoEstandar}</span>
                    </div>
                  </div>

                  <div style={styles.cardHeaderBtns}>
                    <button
                      onClick={() => selectAdversary(adv)}
                      style={isSelected ? styles.btnSelected : styles.btnSelect}
                    >
                      {isSelected ? '✓ Seleccionado' : 'Seleccionar'}
                    </button>
                    <button
                      onClick={() => removeAdversary(adv.instanceId)}
                      style={styles.btnDelete}
                      title="Eliminar del encuentro"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Umbrales de daño */}
                <div style={styles.thresholdsRow}>
                  <span style={styles.thresholdText}>
                    Umbrales: Mayor <strong>{adv.umbralMayor}</strong> · Grave <strong>{adv.umbralGrave}</strong>
                  </span>
                </div>

                {/* Rastreadores Manuales (HP y Estrés) */}
                <div style={styles.trackersGrid}>
                  <MiniTracker
                    label="Puntos de Golpe (HP)"
                    current={adv.hpActual}
                    max={adv.hpMax}
                    color="#c0392b"
                    onToggleSlot={(index, isFilled) => {
                      // Si hace clic en una casilla marcada, ajusta al índice. Si no, llena hasta ese índice + 1
                      const newHp = isFilled ? index : index + 1;
                      updateAdversaryHp(adv.instanceId, newHp);
                    }}
                  />

                  <MiniTracker
                    label="Estrés"
                    current={adv.estresActual}
                    max={adv.estresMax}
                    color="#d4af37"
                    onToggleSlot={(index, isFilled) => {
                      const newStress = isFilled ? index : index + 1;
                      updateAdversaryStress(adv.instanceId, newStress);
                    }}
                  />
                </div>
              </div>
            );
          })
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
    border: '1px solid #4a3728',
    borderRadius: '8px',
    backgroundColor: '#140d06',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #4a3728',
    paddingBottom: '10px',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1.1rem',
    letterSpacing: '0.5px',
  },
  countBadge: {
    backgroundColor: '#2a1e12',
    color: '#a0906a',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  btnAdd: {
    backgroundColor: '#8b1a1a',
    color: '#e8dcc8',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnCancel: {
    backgroundColor: 'transparent',
    color: '#a0906a',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '0.82rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  presetBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    backgroundColor: '#1a1208',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #3a2a1a',
  },
  presetLabel: {
    color: '#7a6a5a',
    fontSize: '0.78rem',
  },
  presetBtn: {
    backgroundColor: '#241a0e',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  form: {
    backgroundColor: '#1c140a',
    border: '1px solid #6b4e28',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formTitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '0.95rem',
    borderBottom: '1px solid #3a2a1a',
    paddingBottom: '6px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    color: '#a0906a',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#0d0905',
    color: '#e8dcc8',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
  },
  select: {
    backgroundColor: '#0d0905',
    color: '#e8dcc8',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
  },
  btnSubmit: {
    backgroundColor: '#8b1a1a',
    color: '#e8dcc8',
    border: '1px solid #d4af37',
    borderRadius: '5px',
    padding: '8px',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '6px',
  },
  encounterList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  emptyState: {
    padding: '24px',
    textAlign: 'center',
    backgroundColor: '#1a1208',
    borderRadius: '6px',
    border: '1px dashed #3a2a1a',
  },
  emptyText: {
    margin: 0,
    color: '#7a6a5a',
    fontSize: '0.85rem',
    fontStyle: 'italic',
  },
  card: {
    border: '1px solid #4a3728',
    borderRadius: '6px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'all 0.15s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
  },
  advName: {
    margin: '0 0 4px 0',
    color: '#e8dcc8',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  activeTag: {
    backgroundColor: '#d4af37',
    color: '#0d0905',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    padding: '1px 5px',
    borderRadius: '3px',
    letterSpacing: '0.5px',
  },
  badgesRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  rankBadge: {
    backgroundColor: '#8b1a1a',
    color: '#e8dcc8',
    fontSize: '0.7rem',
    padding: '1px 6px',
    borderRadius: '3px',
  },
  diffBadge: {
    backgroundColor: '#2a1e12',
    color: '#d4af37',
    border: '1px solid #4a3728',
    fontSize: '0.7rem',
    padding: '1px 6px',
    borderRadius: '3px',
  },
  statChip: {
    color: '#a0906a',
    fontSize: '0.75rem',
    backgroundColor: '#0d0905',
    padding: '1px 6px',
    borderRadius: '3px',
  },
  cardHeaderBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  btnSelect: {
    backgroundColor: 'transparent',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSelected: {
    backgroundColor: '#d4af37',
    color: '#0d0905',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    cursor: 'default',
    fontFamily: 'inherit',
  },
  btnDelete: {
    backgroundColor: 'transparent',
    color: '#7a6a5a',
    border: '1px solid #3a2a1a',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  thresholdsRow: {
    borderTop: '1px solid #2a1e12',
    paddingTop: '6px',
  },
  thresholdText: {
    color: '#7a6a5a',
    fontSize: '0.75rem',
  },
  trackersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
    backgroundColor: '#0d0905',
    padding: '8px 10px',
    borderRadius: '5px',
    border: '1px solid #2a1e12',
  },
  trackerContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  trackerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackerLabel: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  trackerCounter: {
    color: '#7a6a5a',
    fontSize: '0.72rem',
  },
  trackerSlots: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
};
