import React from 'react';
import { encounterStyles as styles } from './encounterStyles';

/**
 * InteractiveTracker: Componente interactivo para marcar/desmarcar casillas de HP o Estrés.
 */
export default function InteractiveTracker({ label, current, max, color, onToggle }) {
  const safeMax = Math.max(1, max || 1);
  const safeCurrent = Math.min(Math.max(0, current || 0), safeMax);

  return (
    <div style={styles.trackerContainer}>
      <div style={styles.trackerHeader}>
        <span style={{ ...styles.trackerLabel, color }}>{label}</span>
        <span style={styles.trackerCounter}>{safeCurrent}/{safeMax}</span>
      </div>
      <div style={styles.trackerSlots}>
        {Array.from({ length: safeMax }).map((_, idx) => {
          const isFilled = idx < safeCurrent;
          return (
            <button
              type="button"
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                // Si hace clic en la casilla ya llena, reduce hasta ese índice.
                // Si hace clic en vacía, llena hasta ese índice + 1.
                onToggle(isFilled ? idx : idx + 1);
              }}
              title={`${label} ${idx + 1} (${isFilled ? 'Marcado' : 'Vacío'})`}
              style={{
                ...styles.trackerCircle,
                borderColor: color,
                backgroundColor: isFilled ? color : 'transparent',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
