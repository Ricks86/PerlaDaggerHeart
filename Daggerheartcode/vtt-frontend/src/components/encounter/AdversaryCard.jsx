import React from 'react';
import InteractiveTracker from './InteractiveTracker';
import { encounterStyles as styles } from './encounterStyles';

/**
 * AdversaryCard: Renderiza un adversario activo dentro de la escena táctica.
 */
export default function AdversaryCard({
  adversary,
  isSelected,
  onSelect,
  onRemove,
  onUpdateHp,
  onUpdateStress,
}) {
  const isDefeated = adversary.hpActual === 0;

  return (
    <div
      onClick={() => onSelect(adversary)}
      style={{
        ...styles.monsterCard,
        borderColor: isSelected
          ? '#d4af37'
          : isDefeated
          ? '#8b1a1a'
          : '#4a3728',
        boxShadow: isSelected
          ? '0 0 16px rgba(212, 175, 55, 0.45)'
          : 'none',
        backgroundColor: isSelected
          ? '#221509'
          : isDefeated
          ? '#140b07'
          : '#1a1208',
        opacity: isDefeated ? 0.65 : 1,
      }}
      title="Haz clic para enfocar este adversario en el panel de tiradas"
    >
      {/* Fila Superior: Nombre, Badges y Botón ✕ */}
      <div style={styles.cardTopRow}>
        <div style={styles.cardNameGroup}>
          <span style={styles.monsterInstanceName}>
            {adversary.nombreInstancia || adversary.nombre}
          </span>
          {isSelected && <span style={styles.badgeFoco}>FOCO</span>}
          {isDefeated && <span style={styles.badgeDerrotado}>💀 DERROTADO</span>}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(adversary.id);
          }}
          style={styles.cardDeleteBtn}
          title="Eliminar este monstruo de la escena"
        >
          ✕
        </button>
      </div>

      {/* Fila de Etiquetas Daggerheart (Tier / Rango / Dificultad) */}
      <div style={styles.badgesBar}>
        <span style={styles.tierTag}>Tier {adversary.tier}</span>
        <span style={styles.rankTag}>{adversary.rango}</span>
        <span style={styles.diffTag}>{adversary.dificultad}</span>
      </div>

      {/* Estadísticas de Ataque y Umbrales */}
      <div style={styles.statsSummary}>
        <span>
          ⚔️ Atk: <strong>+{adversary.modAtaque ?? adversary.modificadorAtaque}</strong>
        </span>
        <span>
          💥 Daño: <strong>{adversary.danoEstandar}</strong>
        </span>
        <span>
          🛡️ M:<strong>{adversary.umbralMayor}</strong> · G:<strong>{adversary.umbralGrave}</strong>
        </span>
      </div>

      {/* Rastreador de HP */}
      <InteractiveTracker
        label="HP"
        current={adversary.hpActual}
        max={adversary.hpMaximo ?? adversary.hpMax}
        color="#c0392b"
        onToggle={(newHp) => onUpdateHp(adversary.id, newHp)}
      />

      {/* Rastreador de Estrés */}
      <InteractiveTracker
        label="Estrés"
        current={adversary.estresActual}
        max={adversary.estresMaximo ?? adversary.estresMax}
        color="#d4af37"
        onToggle={(newStress) => onUpdateStress(adversary.id, newStress)}
      />

      {/* Pasivas / Rasgos especiales */}
      {adversary.rasgosEspeciales && (
        <div style={styles.traitsSnippet} title={adversary.rasgosEspeciales}>
          ✨{' '}
          <em>
            {adversary.rasgosEspeciales.length > 55
              ? adversary.rasgosEspeciales.substring(0, 55) + '…'
              : adversary.rasgosEspeciales}
          </em>
        </div>
      )}
    </div>
  );
}
