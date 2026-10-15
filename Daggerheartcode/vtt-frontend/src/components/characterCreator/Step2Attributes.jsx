import React from 'react';
import { ATTRIBUTES } from './characterCreatorConstants';
import { creatorStyles as styles } from './characterCreatorStyles';

export default function Step2Attributes({
  atributos,
  setAtributos,
  validateStandardArray,
  onBack,
  onNext,
  setErrorMsg,
}) {
  const isArrayValid = validateStandardArray();

  const handleProceed = () => {
    if (!isArrayValid) {
      setErrorMsg('Ajusta los valores para que coincidan con la matriz estándar (+2, +1, +1, +0, +0, -1).');
      return;
    }
    setErrorMsg(null);
    onNext();
  };

  return (
    <div style={styles.stepContent}>
      <div style={styles.stepIntro}>
        <h4 style={styles.stepSubtitle}>Asigna la Matriz Estándar</h4>
        <p style={styles.stepDesc}>
          En Daggerheart, cada héroe reparte exactamente estos 6 modificadores entre sus 6 rasgos:
          <strong style={{ color: '#d4af37' }}> +2, +1, +1, +0, +0, -1</strong>.
        </p>
      </div>

      <div style={styles.attributesGrid}>
        {ATTRIBUTES.map((attr) => (
          <div key={attr.key} style={styles.attrCard}>
            <div style={styles.attrInfo}>
              <strong style={styles.attrName}>{attr.label}</strong>
              <span style={styles.attrDesc}>{attr.desc}</span>
            </div>
            <select
              value={atributos[attr.key]}
              onChange={(e) =>
                setAtributos((prev) => ({
                  ...prev,
                  [attr.key]: parseInt(e.target.value, 10),
                }))
              }
              style={styles.attrSelect}
            >
              <option value={2}>+2</option>
              <option value={1}>+1</option>
              <option value={0}>+0</option>
              <option value={-1}>-1</option>
            </select>
          </div>
        ))}
      </div>

      {!isArrayValid && (
        <div style={styles.warningBox}>
          ⚠️ La combinación actual no coincide exactamente con (+2, +1, +1, +0, +0, -1). Ajusta los valores para continuar.
        </div>
      )}

      <div style={styles.navRow}>
        <button onClick={onBack} style={styles.btnBack}>
          ⬅ Volver a Orígenes
        </button>
        <button
          disabled={!isArrayValid}
          onClick={handleProceed}
          style={isArrayValid ? styles.btnNext : styles.btnDisabled}
        >
          Siguiente: Experiencias ➔
        </button>
      </div>
    </div>
  );
}
