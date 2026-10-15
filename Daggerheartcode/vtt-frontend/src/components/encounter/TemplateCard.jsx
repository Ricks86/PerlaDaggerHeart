import React from 'react';
import { encounterStyles as styles } from './encounterStyles';

/**
 * TemplateCard: Renderiza un molde del Bestiario con sus atributos,
 * selector de cantidad e invocador hacia el grid táctico.
 */
export default function TemplateCard({
  template,
  quantity = 1,
  onQuantityChange,
  onSpawn,
  onDelete,
  remainingSlots,
  loading = false,
}) {
  const canSpawn = remainingSlots >= quantity;

  return (
    <div style={styles.templateCard}>
      <div style={styles.tplHeader}>
        <div>
          <h4 style={styles.tplName}>{template.nombre}</h4>
          <div style={styles.tplBadges}>
            <span style={styles.tplTier}>Tier {template.tier}</span>
            <span style={styles.tplRank}>{template.rango}</span>
            <span style={styles.tplDiff}>{template.dificultad}</span>
          </div>
        </div>

        <button
          onClick={() => onDelete(template)}
          style={styles.tplDeleteBtn}
          title="Eliminar del compendio"
        >
          🗑️
        </button>
      </div>

      <div style={styles.tplStatsGrid}>
        <div>❤️ HP: <strong>{template.hpMaximo}</strong></div>
        <div>⚡ Estrés: <strong>{template.estresMaximo}</strong></div>
        <div>⚔️ Atk: <strong>+{template.modAtaque}</strong></div>
        <div>💥 Daño: <strong>{template.danoEstandar}</strong></div>
        <div style={{ gridColumn: 'span 2' }}>
          🛡️ Umbrales: Mayor <strong>{template.umbralMayor}</strong> · Grave <strong>{template.umbralGrave}</strong>
        </div>
      </div>

      {template.rasgosEspeciales && (
        <div style={styles.tplTraits}>
          <span style={styles.tplTraitsLabel}>Rasgos Especiales:</span>
          <p style={styles.tplTraitsText}>{template.rasgosEspeciales}</p>
        </div>
      )}

      {/* Controles de Invocación */}
      <div style={styles.tplSpawnFooter}>
        <div style={styles.qtyPicker}>
          <label style={styles.qtyLabel}>Cant:</label>
          <select
            value={quantity}
            onChange={(e) => onQuantityChange(template.id, e.target.value)}
            style={styles.qtySelect}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n} disabled={n > remainingSlots}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onSpawn(template)}
          disabled={!canSpawn || loading}
          style={canSpawn ? styles.btnSpawn : styles.btnSpawnDisabled}
          title={
            canSpawn
              ? `Invocar ${quantity} ${template.nombre}`
              : 'No hay espacio en la escena (máx 15)'
          }
        >
          ⚔️ Añadir al Encuentro {quantity > 1 ? `(x${quantity})` : ''}
        </button>
      </div>
    </div>
  );
}
