import React from 'react';
import { creatorStyles as styles } from './characterCreatorStyles';

export default function Step3Experiences({
  exp1,
  setExp1,
  exp2,
  setExp2,
  onBack,
  onNext,
  setErrorMsg,
}) {
  const handleProceed = () => {
    if (!exp1.trim() || !exp2.trim()) {
      setErrorMsg('Por favor completa ambas experiencias iniciales.');
      return;
    }
    setErrorMsg(null);
    onNext();
  };

  return (
    <div style={styles.stepContent}>
      <div style={styles.stepIntro}>
        <h4 style={styles.stepSubtitle}>Experiencias Fundacionales (Nivel 1)</h4>
        <p style={styles.stepDesc}>
          Define dos experiencias que describan el trasfondo de tu personaje. Cada una otorga un bonificador de{' '}
          <strong style={{ color: '#d4af37' }}>+2</strong> cuando se aplique en tus tiradas.
        </p>
      </div>

      <div style={styles.expGrid}>
        <div style={styles.expCard}>
          <div style={styles.expHeader}>
            <label style={styles.label}>Experiencia 1:</label>
            <span style={styles.expValueBadge}>+2 a tiradas</span>
          </div>
          <input
            type="text"
            required
            value={exp1}
            onChange={(e) => setExp1(e.target.value)}
            placeholder="Ej. Cazarrecompensas de la Costa, Erudito de Reliquias..."
            style={styles.input}
          />
        </div>

        <div style={styles.expCard}>
          <div style={styles.expHeader}>
            <label style={styles.label}>Experiencia 2:</label>
            <span style={styles.expValueBadge}>+2 a tiradas</span>
          </div>
          <input
            type="text"
            required
            value={exp2}
            onChange={(e) => setExp2(e.target.value)}
            placeholder="Ej. Superviviente de Asedios, Hablante con Bestias..."
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.navRow}>
        <button onClick={onBack} style={styles.btnBack}>
          ⬅ Volver a Atributos
        </button>
        <button onClick={handleProceed} style={styles.btnNext}>
          Siguiente: Cartas de Dominio ➔
        </button>
      </div>
    </div>
  );
}
