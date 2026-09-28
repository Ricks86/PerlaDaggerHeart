import React, { useState } from 'react';
import { useDm } from '../context/DmContext';
import { useWebSocket } from '../context/WebSocketContext';

// =============================================================================
// Helper: Parser de fórmula de daño (ej: "2d8+3", "1d10", "3d6-1", "d12")
// =============================================================================
function parseDamageFormula(formula) {
  if (!formula || typeof formula !== 'string') {
    return { numDice: 1, dieSides: 8, modifier: 0, raw: '1d8' };
  }

  // Regex flexible que captura: (numDados)? d (caras) ([+-] modificador)?
  const cleaned = formula.trim().replace(/\s+/g, '');
  const match = cleaned.match(/^(\d*)d(\d+)(?:([+-])(\d+))?$/i);

  if (!match) {
    // Si no coincide con notación estándar, fallback seguro a 1d8
    return { numDice: 1, dieSides: 8, modifier: 0, raw: formula };
  }

  const numDice = match[1] ? parseInt(match[1], 10) : 1;
  const dieSides = parseInt(match[2], 10);
  const sign = match[3] || '+';
  const modValue = match[4] ? parseInt(match[4], 10) : 0;
  const modifier = sign === '-' ? -modValue : modValue;

  return { numDice, dieSides, modifier, raw: formula };
}

/**
 * Genera entero aleatorio entre min y max (ambos inclusivos).
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// =============================================================================
// Componente Principal: DmRoller
// =============================================================================

export default function DmRoller() {
  const { selectedAdversary } = useDm();
  const { sendTableAction, connected } = useWebSocket();

  // Estados visuales y de resultado
  const [lastAttackResult, setLastAttackResult] = useState(null);
  const [lastDamageResult, setLastDamageResult] = useState(null);
  const [isCritManual, setIsCritManual] = useState(false);

  // ---------------------------------------------------------------------------
  // Si no hay adversario seleccionado
  // ---------------------------------------------------------------------------
  if (!selectedAdversary) {
    return (
      <div style={styles.containerEmpty}>
        <div style={styles.emptyIcon}>👑</div>
        <h4 style={styles.emptyTitle}>Motor de Dados del DJ</h4>
        <p style={styles.emptySubtitle}>
          Selecciona un adversario en el panel de encuentro para ejecutar sus tiradas de ataque y daño.
        </p>
      </div>
    );
  }

  const parsedFormula = parseDamageFormula(selectedAdversary.danoEstandar);
  const maxDiceBonus = parsedFormula.numDice * parsedFormula.dieSides;

  // ---------------------------------------------------------------------------
  // Lógica: TIRADA DE ATAQUE (d20 + mod)
  // ---------------------------------------------------------------------------
  function handleAttackRoll() {
    if (!connected) return;

    const naturalD20 = randomInt(1, 20);
    const mod = selectedAdversary.modificadorAtaque || 0;
    const total = naturalD20 + mod;
    const isCritical = naturalD20 === 20;

    // Si sacó 20 natural, sugerir automáticamente daño crítico
    if (isCritical) {
      setIsCritManual(true);
    }

    const modSign = mod >= 0 ? `+${mod}` : `${mod}`;
    const critText = isCritical ? ' ¡Éxito Crítico!' : '';

    const resultMessage = `${selectedAdversary.nombre} ataca: d20(${naturalD20}) + Mod(${modSign}) = ${total}${critText}`;

    setLastAttackResult({
      naturalD20,
      mod,
      total,
      isCritical,
      message: resultMessage,
    });
    setLastDamageResult(null);

    sendTableAction('DM_ROLL', 'Dungeon Master', {
      result: resultMessage,
      adversary: selectedAdversary.nombre,
      type: 'ATTACK',
      naturalD20,
      total,
      isCritical,
    });
  }

  // ---------------------------------------------------------------------------
  // Lógica: TIRADA DE DAÑO (Dados + Modificador [+ MaxDados en Crítico])
  // ---------------------------------------------------------------------------
  function handleDamageRoll() {
    if (!connected) return;

    const { numDice, dieSides, modifier } = parsedFormula;
    const rolls = [];

    for (let i = 0; i < numDice; i++) {
      rolls.push(randomInt(1, dieSides));
    }

    const diceSum = rolls.reduce((acc, val) => acc + val, 0);
    const critBonus = isCritManual ? maxDiceBonus : 0;
    const total = diceSum + modifier + critBonus;

    const modSign = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    const critText = isCritManual
      ? ` + Crítico Máx(${maxDiceBonus})`
      : '';

    const resultMessage = `${selectedAdversary.nombre} inflige daño${isCritManual ? ' CRÍTICO' : ''}: [${rolls.join(', ')}]${critText} + Mod(${modSign}) = ${total} de daño`;

    setLastDamageResult({
      rolls,
      diceSum,
      modifier,
      critBonus,
      total,
      isCrit: isCritManual,
      message: resultMessage,
    });

    sendTableAction('DM_ROLL', 'Dungeon Master', {
      result: resultMessage,
      adversary: selectedAdversary.nombre,
      type: 'DAMAGE',
      rolls,
      total,
      isCrit: isCritManual,
    });

    // Resetear el flag de crítico tras usarlo
    if (isCritManual) {
      setIsCritManual(false);
    }
  }

  return (
    <div style={styles.container}>
      {/* Cabecera del Monstruo Activo */}
      <div style={styles.adversaryHeader}>
        <div style={styles.adversaryInfo}>
          <span style={styles.adversaryPreTitle}>Adversario Activo</span>
          <h3 style={styles.adversaryTitle}>{selectedAdversary.nombre}</h3>
        </div>
        <div style={styles.statTags}>
          <span style={styles.tag}>Mod. Ataque: <strong>+{selectedAdversary.modificadorAtaque}</strong></span>
          <span style={styles.tag}>Fórmula Daño: <strong>{selectedAdversary.danoEstandar}</strong></span>
        </div>
      </div>

      {/* Botones Gigantes de Acción */}
      <div style={styles.buttonsGrid}>
        <button
          onClick={handleAttackRoll}
          disabled={!connected}
          style={connected ? styles.btnAttack : styles.btnDisabled}
        >
          <span style={styles.btnIcon}>⚔️</span>
          <span style={styles.btnText}>TIRADA DE ATAQUE</span>
          <span style={styles.btnSubtext}>1d20 + {selectedAdversary.modificadorAtaque}</span>
        </button>

        <button
          onClick={handleDamageRoll}
          disabled={!connected}
          style={connected ? styles.btnDamage : styles.btnDisabled}
        >
          <span style={styles.btnIcon}>💥</span>
          <span style={styles.btnText}>TIRADA DE DAÑO</span>
          <span style={styles.btnSubtext}>
            {selectedAdversary.danoEstandar}
            {isCritManual ? ` (+${maxDiceBonus} CRÍTICO)` : ''}
          </span>
        </button>
      </div>

      {/* Toggle de Crítico para Daño */}
      <div style={styles.critToggleRow}>
        <label style={styles.critLabel}>
          <input
            type="checkbox"
            checked={isCritManual}
            onChange={(e) => setIsCritManual(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={isCritManual ? styles.critActiveText : styles.critInactiveText}>
            ⚡ Aplicar Daño Crítico (+{maxDiceBonus} máx de dados)
          </span>
        </label>
      </div>

      {/* Últimos resultados visuales para el DJ */}
      {lastAttackResult && (
        <div
          style={{
            ...styles.resultCard,
            borderColor: lastAttackResult.isCritical ? '#f4c430' : '#4a3728',
            backgroundColor: lastAttackResult.isCritical ? '#2d2200' : '#1a1208',
          }}
        >
          <div style={styles.resultHeader}>
            <span style={styles.resultType}>Resultado de Ataque</span>
            {lastAttackResult.isCritical && (
              <span style={styles.critBadge}>¡CRÍTICO (d20 = 20)!</span>
            )}
          </div>
          <div style={styles.resultTotal}>{lastAttackResult.total}</div>
          <div style={styles.resultExplanation}>
            d20 ({lastAttackResult.naturalD20}) + Mod ({lastAttackResult.mod})
          </div>
        </div>
      )}

      {lastDamageResult && (
        <div
          style={{
            ...styles.resultCard,
            borderColor: lastDamageResult.isCrit ? '#f4c430' : '#8b1a1a',
            backgroundColor: lastDamageResult.isCrit ? '#2d2200' : '#1e1008',
          }}
        >
          <div style={styles.resultHeader}>
            <span style={styles.resultType}>Resultado de Daño</span>
            {lastDamageResult.isCrit && (
              <span style={styles.critBadge}>¡DAÑO CRÍTICO APLICADO!</span>
            )}
          </div>
          <div style={{ ...styles.resultTotal, color: '#ff6b6b' }}>
            {lastDamageResult.total} <span style={styles.damageWord}>daño</span>
          </div>
          <div style={styles.resultExplanation}>
            Dados: [{lastDamageResult.rolls.join(', ')}]
            {lastDamageResult.critBonus > 0 && ` + Crítico (+${lastDamageResult.critBonus})`}
            {' '} + Mod ({lastDamageResult.modifier})
          </div>
        </div>
      )}
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
  containerEmpty: {
    border: '1px dashed #4a3728',
    borderRadius: '8px',
    backgroundColor: '#140d06',
    padding: '32px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    marginBottom: '8px',
  },
  emptyTitle: {
    margin: '0 0 6px 0',
    color: '#d4af37',
    fontSize: '1.1rem',
  },
  emptySubtitle: {
    margin: 0,
    color: '#7a6a5a',
    fontSize: '0.85rem',
    maxWidth: '300px',
    lineHeight: '1.4',
  },
  adversaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #4a3728',
    paddingBottom: '10px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  adversaryInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  adversaryPreTitle: {
    color: '#7a6a5a',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  adversaryTitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1.2rem',
  },
  statTags: {
    display: 'flex',
    gap: '8px',
  },
  tag: {
    backgroundColor: '#1a1208',
    border: '1px solid #4a3728',
    color: '#e8dcc8',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.78rem',
  },
  buttonsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  btnAttack: {
    backgroundColor: '#1a3320',
    border: '2px solid #2e7d32',
    borderRadius: '8px',
    padding: '16px 12px',
    color: '#e8dcc8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease, transform 0.1s ease',
  },
  btnDamage: {
    backgroundColor: '#4a1515',
    border: '2px solid #c0392b',
    borderRadius: '8px',
    padding: '16px 12px',
    color: '#e8dcc8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease, transform 0.1s ease',
  },
  btnDisabled: {
    backgroundColor: '#241a0e',
    border: '1px solid #4a3728',
    borderRadius: '8px',
    padding: '16px 12px',
    color: '#7a6a5a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
  btnIcon: {
    fontSize: '1.6rem',
  },
  btnText: {
    fontWeight: 'bold',
    fontSize: '0.95rem',
    letterSpacing: '0.5px',
  },
  btnSubtext: {
    fontSize: '0.75rem',
    color: '#a0906a',
  },
  critToggleRow: {
    backgroundColor: '#1a1208',
    border: '1px solid #3a2a1a',
    padding: '8px 12px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
  },
  critLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    width: '100%',
  },
  checkbox: {
    cursor: 'pointer',
    width: '16px',
    height: '16px',
  },
  critActiveText: {
    color: '#f4c430',
    fontWeight: 'bold',
    fontSize: '0.82rem',
  },
  critInactiveText: {
    color: '#7a6a5a',
    fontSize: '0.82rem',
  },
  resultCard: {
    border: '1px solid',
    borderRadius: '6px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultType: {
    color: '#a0906a',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
  },
  critBadge: {
    backgroundColor: '#f4c430',
    color: '#0d0905',
    fontWeight: 'bold',
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  resultTotal: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#e8dcc8',
    lineHeight: '1.1',
  },
  damageWord: {
    fontSize: '1rem',
    color: '#a0906a',
  },
  resultExplanation: {
    color: '#a0906a',
    fontSize: '0.8rem',
  },
};
