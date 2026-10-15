import React from 'react';
import { encounterStyles as styles } from './encounterStyles';

/**
 * CreateMonsterForm: Formulario de creación de monstruos con 3 opciones de acción:
 * 1. Guardar en Compendio
 * 2. Guardar y Añadir a la Escena
 * 3. Solo Invocar a la Escena (efímero)
 */
export default function CreateMonsterForm({
  formData,
  formSpawnQuantity,
  setFormSpawnQuantity,
  formFeedback,
  onFormChange,
  onSaveOnlyTemplate,
  onSaveAndSpawn,
  onDirectSpawnWithoutSaving,
  remainingSlots,
}) {
  const hasName = !!formData.nombre.trim();
  const canSpawn = hasName && remainingSlots >= formSpawnQuantity;

  return (
    <form style={styles.createForm}>
      {formFeedback && (
        <div
          style={{
            ...styles.feedbackBanner,
            backgroundColor: formFeedback.type === 'success' ? '#14331e' : '#451010',
            color: formFeedback.type === 'success' ? '#84f0a0' : '#ff9999',
            borderColor: formFeedback.type === 'success' ? '#2ecc71' : '#e74c3c',
          }}
        >
          {formFeedback.text}
        </div>
      )}

      <div style={styles.formRow}>
        <div style={{ ...styles.formGroup, flex: 2 }}>
          <label style={styles.formLabel}>Nombre del Monstruo *</label>
          <input
            type="text"
            required
            placeholder="Ej: Trasgo Hostigador, Líder Bandido, Draco Rojo..."
            value={formData.nombre}
            onChange={(e) => onFormChange('nombre', e.target.value)}
            style={styles.formInput}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Tier</label>
          <select
            value={formData.tier}
            onChange={(e) => onFormChange('tier', e.target.value)}
            style={styles.formSelect}
          >
            <option value={1}>Tier 1</option>
            <option value={2}>Tier 2</option>
            <option value={3}>Tier 3</option>
            <option value={4}>Tier 4</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Rango</label>
          <select
            value={formData.rango}
            onChange={(e) => onFormChange('rango', e.target.value)}
            style={styles.formSelect}
          >
            <option value="Menor">Menor</option>
            <option value="Estándar">Estándar</option>
            <option value="Horda">Horda</option>
            <option value="Líder">Líder</option>
            <option value="Solitario">Solitario</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Dificultad</label>
          <select
            value={formData.dificultad}
            onChange={(e) => onFormChange('dificultad', e.target.value)}
            style={styles.formSelect}
          >
            <option value="Fácil">Fácil</option>
            <option value="Moderado">Moderado</option>
            <option value="Difícil">Difícil</option>
          </select>
        </div>
      </div>

      <div style={styles.formRow}>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>HP Máximo</label>
          <input
            type="number"
            min="1"
            max="30"
            value={formData.hpMaximo}
            onChange={(e) => onFormChange('hpMaximo', e.target.value)}
            style={styles.formInput}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Estrés Máximo</label>
          <input
            type="number"
            min="0"
            max="15"
            value={formData.estresMaximo}
            onChange={(e) => onFormChange('estresMaximo', e.target.value)}
            style={styles.formInput}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Umbral Mayor</label>
          <input
            type="number"
            min="0"
            value={formData.umbralMayor}
            onChange={(e) => onFormChange('umbralMayor', e.target.value)}
            style={styles.formInput}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Umbral Grave</label>
          <input
            type="number"
            min="0"
            value={formData.umbralGrave}
            onChange={(e) => onFormChange('umbralGrave', e.target.value)}
            style={styles.formInput}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Mod. Ataque</label>
          <input
            type="number"
            value={formData.modAtaque}
            onChange={(e) => onFormChange('modAtaque', e.target.value)}
            style={styles.formInput}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Daño Estándar</label>
          <input
            type="text"
            placeholder="1d8+2, 2d6..."
            value={formData.danoEstandar}
            onChange={(e) => onFormChange('danoEstandar', e.target.value)}
            style={styles.formInput}
          />
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.formLabel}>
          Rasgos Especiales (Pasivas, Reacciones o Movimientos de Miedo)
        </label>
        <textarea
          rows="3"
          placeholder="Ej: [Reacción de Miedo] Al recibir daño grave, gasta 1 punto de miedo para contraatacar inmediatamente con ventaja..."
          value={formData.rasgosEspeciales}
          onChange={(e) => onFormChange('rasgosEspeciales', e.target.value)}
          style={styles.formTextarea}
        />
      </div>

      {/* Fila de Acciones del Formulario */}
      <div style={styles.formActionsRow}>
        <div style={styles.formSpawnQtyBox}>
          <label style={styles.formQtyLabel}>Cantidad al invocar:</label>
          <select
            value={formSpawnQuantity}
            onChange={(e) => setFormSpawnQuantity(parseInt(e.target.value, 10))}
            style={styles.formQtySelect}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n} disabled={n > remainingSlots}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formButtonsGroup}>
          <button
            type="button"
            onClick={onSaveOnlyTemplate}
            disabled={!hasName}
            style={hasName ? styles.btnSaveTemplate : styles.btnDisabled}
          >
            💾 Guardar en Compendio
          </button>

          <button
            type="button"
            onClick={onSaveAndSpawn}
            disabled={!canSpawn}
            style={canSpawn ? styles.btnSaveAndSpawn : styles.btnDisabled}
          >
            ⚔️ Guardar y Añadir ({formSpawnQuantity})
          </button>

          <button
            type="button"
            onClick={onDirectSpawnWithoutSaving}
            disabled={!canSpawn}
            style={canSpawn ? styles.btnDirectSpawn : styles.btnDisabled}
            title="Añade solo a la escena actual sin guardar en el compendio"
          >
            ⚡ Solo Invocar ({formSpawnQuantity})
          </button>
        </div>
      </div>
    </form>
  );
}
