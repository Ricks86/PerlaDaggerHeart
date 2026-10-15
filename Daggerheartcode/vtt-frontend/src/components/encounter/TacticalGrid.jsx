import React from 'react';
import AdversaryCard from './AdversaryCard';
import { encounterStyles as styles } from './encounterStyles';

/**
 * TacticalGrid: Cuadrícula táctica con capacidad para 15 adversarios,
 * cabecera de encuentro, indicador de foco y controles de escena.
 */
export default function TacticalGrid({
  activeEncounter,
  selectedAdversary,
  onClearScene,
  onSelectAdversary,
  onRemoveAdversary,
  onUpdateHp,
  onUpdateStress,
}) {
  const isFull = activeEncounter.length >= 15;

  return (
    <section style={styles.sceneSection}>
      <div style={styles.sceneHeader}>
        <div style={styles.sceneTitleGroup}>
          <h3 style={styles.sceneTitle}>💀 Encuentro Activo · Grid Táctico</h3>
          <span
            style={{
              ...styles.capacityBadge,
              backgroundColor: isFull ? '#8b1a1a' : '#231509',
              color: isFull ? '#ff9999' : '#d4af37',
            }}
          >
            {activeEncounter.length} / 15 Activos
          </span>
          {selectedAdversary && (
            <span style={styles.selectedIndicator}>
              🎯 En foco: <strong>{selectedAdversary.nombreInstancia || selectedAdversary.nombre}</strong>
            </span>
          )}
        </div>

        <div style={styles.sceneActions}>
          <button
            onClick={onClearScene}
            disabled={activeEncounter.length === 0}
            style={activeEncounter.length === 0 ? styles.btnClearDisabled : styles.btnClear}
            title="Vaciar todos los adversarios de la escena actual"
          >
            🗑️ Limpiar Escena
          </button>
        </div>
      </div>

      {/* Cuadrícula Táctica */}
      {activeEncounter.length === 0 ? (
        <div style={styles.emptyGridContainer}>
          <span style={styles.emptyIcon}>⚔️</span>
          <h4 style={styles.emptyGridTitle}>No hay adversarios en el encuentro</h4>
          <p style={styles.emptyGridText}>
            Selecciona uno o más monstruos del <strong>Bestiario</strong> inferior o usa el formulario para crear e invocar nuevos enemigos en la cuadrícula.
          </p>
        </div>
      ) : (
        <div style={styles.gridTactico}>
          {activeEncounter.map((adv) => {
            const isSelected = selectedAdversary?.id === adv.id;
            return (
              <AdversaryCard
                key={adv.id}
                adversary={adv}
                isSelected={isSelected}
                onSelect={onSelectAdversary}
                onRemove={onRemoveAdversary}
                onUpdateHp={onUpdateHp}
                onUpdateStress={onUpdateStress}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
