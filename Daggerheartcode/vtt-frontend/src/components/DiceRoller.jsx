import React, { useEffect, useRef, useState } from 'react';
import { useCharacter } from '../context/CharacterContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useDice } from '../context/DiceContext';

// =============================================================================
// Utilidades
// =============================================================================

/** Número entero aleatorio inclusivo en ambos extremos */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Extrae los lados de un dado: 'd8' → 8 */
function parseSides(dieStr) {
  return parseInt(dieStr.replace('d', ''), 10);
}

/** Formatea modificador con signo: 2 → '+2', -1 → '-1', 0 → '+0' */
function fmtMod(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

// =============================================================================
// Constantes
// =============================================================================

const DICE_PALETTE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];

const VERDICT_STYLES = {
  '⚡ Éxito Crítico':         { color: '#f4c430', bg: '#3a2e00' },
  '✨ Éxito con Esperanza':   { color: '#4caf50', bg: '#0d2b10' },
  '😰 Fallo/Éxito con Miedo': { color: '#ef5350', bg: '#2b0d0d' },
};

// =============================================================================
// Subcomponentes de UI
// =============================================================================

/** Dado visual con cara superior mostrando el número */
function DiceFace({ label, sublabel, value, colorFilled, colorBorder }) {
  return (
    <div style={{ ...styles.diceFace, borderColor: colorBorder }}>
      <div style={{ ...styles.diceFaceInner, backgroundColor: value ? colorFilled : 'transparent' }}>
        {value !== null ? (
          <span style={styles.diceNumber}>{value}</span>
        ) : (
          <span style={styles.dicePlaceholder}>?</span>
        )}
      </div>
      <span style={styles.diceLabel}>{label}</span>
      <span style={styles.diceSublabel}>{sublabel}</span>
    </div>
  );
}

/** Control numérico de modificador con botones +/- */
function ModifierInput({ value, onChange, label = 'Modificador' }) {
  return (
    <div style={styles.modRow}>
      <span style={styles.modLabel}>{label}</span>
      <div style={styles.modControls}>
        <button onClick={() => onChange(value - 1)} style={styles.modBtn}>−</button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          style={styles.modInput}
        />
        <button onClick={() => onChange(value + 1)} style={styles.modBtn}>+</button>
      </div>
    </div>
  );
}

// =============================================================================
// Componente principal: DiceRoller
// =============================================================================

/**
 * Motor de dados dual de Daggerheart.
 *
 * PESTAÑA DUALITY:
 *   Tira 2d12 (Hope + Fear) + Modificador + Ventaja/Desventaja (±d6).
 *   Determina veredicto por comparación Hope vs Fear.
 *   Si Hope === Fear → Éxito Crítico.
 *
 * PESTAÑA CUSTOM:
 *   Permite apilar cualquier combinación de dados (d4-d20).
 *   Muestra desglose individual por dado al resolver.
 *
 * INTEGRACIÓN CON ATRIBUTOS:
 *   Cuando el jugador hace clic en un atributo del CharacterHeader,
 *   el DiceRoller cambia a DUALITY y aplica ese modificador vía DiceContext.
 */
export default function DiceRoller() {
  const { character } = useCharacter();
  const { sendTableAction, connected } = useWebSocket();
  const { pendingModifier, clearPendingModifier } = useDice();

  // -------------------------------------------------------------------------
  // Estado de pestaña y visibilidad del panel
  // -------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('DUALITY');
  const [isOpen, setIsOpen]       = useState(false); // Colapsado por defecto


  // -------------------------------------------------------------------------
  // Estado DUALITY
  // -------------------------------------------------------------------------
  const [modifier, setModifier]               = useState(0);
  const [advantageStatus, setAdvantageStatus] = useState('NONE'); // 'NONE'|'ADV'|'DISADV'
  const [dualityResult, setDualityResult]     = useState(null);
  const [isRolling, setIsRolling]             = useState(false);

  // -------------------------------------------------------------------------
  // Estado CUSTOM
  // -------------------------------------------------------------------------
  const [diceQueue, setDiceQueue]       = useState([]);
  const [customModifier, setCustomMod]  = useState(0);
  const [customResult, setCustomResult] = useState(null);

  // -------------------------------------------------------------------------
  // Efecto: recibir modificador desde CharacterHeader (atributo clickeado)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (pendingModifier) {
      setModifier(pendingModifier.value);
      setActiveTab('DUALITY');
      setIsOpen(true);           // Abre el panel automáticamente
      setDualityResult(null);
      clearPendingModifier();
    }
  }, [pendingModifier]);

  // -------------------------------------------------------------------------
  // Handlers de Ventaja
  // -------------------------------------------------------------------------
  function toggleAdvantage(type) {
    setAdvantageStatus((prev) => (prev === type ? 'NONE' : type));
  }

  // -------------------------------------------------------------------------
  // DUALITY ROLL
  // -------------------------------------------------------------------------
  function handleDualityRoll() {
    if (!connected) return;

    // Animación breve
    setIsRolling(true);
    setDualityResult(null);

    setTimeout(() => {
      const hopeRoll = randomInt(1, 12);
      const fearRoll = randomInt(1, 12);

      // Ventaja / Desventaja
      let advRoll = 0;
      let advStr  = '';
      if (advantageStatus === 'ADV') {
        advRoll = randomInt(1, 6);
        advStr  = ` + Ventaja d6(${advRoll})`;
      } else if (advantageStatus === 'DISADV') {
        advRoll = -randomInt(1, 6);
        advStr  = ` - Desventaja d6(${Math.abs(advRoll)})`;
      }

      const total = hopeRoll + fearRoll + modifier + advRoll;

      // Veredicto
      let verdict;
      if (hopeRoll === fearRoll) {
        verdict = '⚡ Éxito Crítico';
      } else if (hopeRoll > fearRoll) {
        verdict = '✨ Éxito con Esperanza';
      } else {
        verdict = '😰 Fallo/Éxito con Miedo';
      }

      const resultStr = `Dualidad: Hope(${hopeRoll}) + Fear(${fearRoll})${modifier !== 0 ? ` + Mod(${fmtMod(modifier)})` : ''}${advStr} = ${total} — ${verdict}`;

      const resultObj = { hopeRoll, fearRoll, modifier, advRoll, total, verdict, resultStr };
      setDualityResult(resultObj);
      setIsRolling(false);

      sendTableAction('ROLL', character?.nombre ?? 'Jugador', {
        result: resultStr,
        type: 'DUALITY',
        hopeRoll, fearRoll, modifier, advRoll, total, verdict,
      });
    }, 300);
  }

  // -------------------------------------------------------------------------
  // CUSTOM ROLL
  // -------------------------------------------------------------------------
  function addDie(die) {
    setDiceQueue((prev) => [...prev, die]);
    setCustomResult(null);
  }

  function clearQueue() {
    setDiceQueue([]);
    setCustomResult(null);
    setCustomMod(0);
  }

  function removeDie(index) {
    setDiceQueue((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCustomRoll() {
    if (!connected || diceQueue.length === 0) return;

    // Tirar cada dado individualmente
    const results = diceQueue.map((die) => randomInt(1, parseSides(die)));
    const sumDice = results.reduce((a, b) => a + b, 0);
    const total   = sumDice + customModifier;

    const diceStr    = diceQueue.join(' + ');
    const resultStr  = `Custom (${diceStr})${customModifier !== 0 ? ` ${fmtMod(customModifier)}` : ''}: [${results.join(', ')}]${customModifier !== 0 ? ` ${fmtMod(customModifier)}` : ''} = ${total}`;

    setCustomResult({ dice: diceQueue, results, customModifier, total, resultStr });

    sendTableAction('ROLL', character?.nombre ?? 'Jugador', {
      result: resultStr,
      type: 'CUSTOM',
      dice: diceStr, results, customModifier, total,
    });

    // Limpia la cola tras enviar
    setDiceQueue([]);
  }

  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  const playerName = character?.nombre ?? '—';

  return (
    <div style={styles.container}>

      {/* -------------------------------------------------------------------- */}
      {/* Barra de cabecera: siempre visible                                   */}
      {/* -------------------------------------------------------------------- */}
      <div style={styles.headerBar}>
        <div style={styles.tabBar}>
          <button
            onClick={() => { setActiveTab('DUALITY'); setIsOpen(true); }}
            style={activeTab === 'DUALITY' && isOpen ? styles.tabActive : styles.tabInactive}
          >
            ⚔️ Duality
          </button>
          <button
            onClick={() => { setActiveTab('CUSTOM'); setIsOpen(true); }}
            style={activeTab === 'CUSTOM' && isOpen ? styles.tabActive : styles.tabInactive}
          >
            🎲 Custom
          </button>
        </div>
        <button
          onClick={() => setIsOpen((v) => !v)}
          style={styles.toggleBtn}
          title={isOpen ? 'Ocultar panel de dados' : 'Mostrar panel de dados'}
        >
          {isOpen ? '▲ Ocultar' : '▼ Dados'}
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Panel DUALITY (colapsable)                                            */}
      {/* -------------------------------------------------------------------- */}
      {isOpen && activeTab === 'DUALITY' && (
        <div style={styles.panel}>
          <div style={styles.diceRow}>
            <DiceFace
              label="HOPE" sublabel="d12"
              value={dualityResult?.hopeRoll ?? null}
              colorFilled="#0d2b10" colorBorder="#4caf50"
            />
            <span style={styles.plus}>+</span>
            <DiceFace
              label="FEAR" sublabel="d12"
              value={dualityResult?.fearRoll ?? null}
              colorFilled="#2b0d0d" colorBorder="#ef5350"
            />
          </div>

          <div style={styles.advRow}>
            <button
              onClick={() => toggleAdvantage('ADV')}
              style={advantageStatus === 'ADV' ? styles.advBtnOn : styles.advBtnAdv}
            >
              ▲ Ventaja
            </button>
            <button
              onClick={() => toggleAdvantage('DISADV')}
              style={advantageStatus === 'DISADV' ? styles.advBtnOn : styles.advBtnDisadv}
            >
              ▼ Desventaja
            </button>
          </div>

          {advantageStatus !== 'NONE' && (
            <p style={styles.advHint}>
              {advantageStatus === 'ADV' ? '+ d6 sumado al resultado' : '− d6 restado del resultado'}
              {dualityResult?.advRoll != null && dualityResult.advRoll !== 0
                ? ` (${dualityResult.advRoll > 0 ? '+' : ''}${dualityResult.advRoll})`
                : ''}
            </p>
          )}

          <ModifierInput value={modifier} onChange={setModifier} label="Modificador" />

          <button
            onClick={handleDualityRoll}
            disabled={!connected || isRolling}
            style={connected ? styles.rollBtn : styles.rollBtnDisabled}
          >
            {isRolling ? '🎲 Tirando...' : '🎲 ROLL'}
          </button>

          {dualityResult && (
            <div style={{
              ...styles.resultBox,
              borderColor: VERDICT_STYLES[dualityResult.verdict]?.color ?? '#d4af37',
              backgroundColor: VERDICT_STYLES[dualityResult.verdict]?.bg ?? '#1a1208',
            }}>
              <div style={styles.totalRow}>
                <span style={styles.totalNumber}>{dualityResult.total}</span>
                <span style={{ ...styles.verdict, color: VERDICT_STYLES[dualityResult.verdict]?.color ?? '#d4af37' }}>
                  {dualityResult.verdict}
                </span>
              </div>
              <p style={styles.resultDetail}>
                Hope {dualityResult.hopeRoll} + Fear {dualityResult.fearRoll}
                {modifier !== 0 && ` ${fmtMod(modifier)}`}
                {dualityResult.advRoll !== 0 &&
                  ` ${dualityResult.advRoll > 0 ? '+ Ventaja' : '− Desventaja'} (${Math.abs(dualityResult.advRoll)})`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Panel CUSTOM (colapsable)                                             */}
      {/* -------------------------------------------------------------------- */}
      {isOpen && activeTab === 'CUSTOM' && (
        <div style={styles.panel}>
          <p style={styles.paletteLabel}>Agregar dados:</p>
          <div style={styles.palette}>
            {DICE_PALETTE.map((die) => (
              <button
                key={die}
                onClick={() => addDie(die)}
                style={styles.diePaletteBtn}
                title={`Agregar ${die}`}
              >
                +{die}
              </button>
            ))}
          </div>

          <div style={styles.queueArea}>
            {diceQueue.length === 0 ? (
              <span style={styles.queueEmpty}>— Ningún dado agregado —</span>
            ) : (
              <div style={styles.queueDisplay}>
                {diceQueue.map((die, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={styles.queuePlus}>+</span>}
                    <button onClick={() => removeDie(i)} style={styles.queueDie} title="Clic para quitar">
                      {die}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          <ModifierInput value={customModifier} onChange={setCustomMod} label="Modificador" />

          <div style={styles.customActions}>
            <button onClick={clearQueue} style={styles.clearBtn} disabled={diceQueue.length === 0}>
              ✕ Limpiar
            </button>
            <button
              onClick={handleCustomRoll}
              disabled={!connected || diceQueue.length === 0}
              style={connected && diceQueue.length > 0 ? styles.rollBtn : styles.rollBtnDisabled}
            >
              🎲 ROLL
            </button>
          </div>

          {customResult && (
            <div style={{ ...styles.resultBox, borderColor: '#d4af37' }}>
              <div style={styles.totalRow}>
                <span style={styles.totalNumber}>{customResult.total}</span>
              </div>
              <p style={styles.resultDetail}>
                [{customResult.results.join(', ')}]
                {customResult.customModifier !== 0 && ` ${fmtMod(customResult.customModifier)}`}
              </p>
              <p style={{ ...styles.resultDetail, color: '#7a6a5a', fontSize: '0.75rem' }}>
                {customResult.dice.join(' + ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Nombre del jugador activo (siempre visible) */}
      <div style={styles.footer}>
        Jugador: <span style={{ color: '#d4af37' }}>{playerName}</span>
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
    backgroundColor: '#1a1208',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },

  // Barra de cabecera (siempre visible)
  headerBar: {
    display: 'flex',
    alignItems: 'stretch',
    borderBottom: '2px solid #4a3728',
  },
  toggleBtn: {
    padding: '8px 14px',
    backgroundColor: '#0d0905',
    color: '#a0906a',
    border: 'none',
    borderLeft: '1px solid #4a3728',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  // Pestañas (dentro del headerBar)
  tabBar: {
    display: 'flex',
    flex: 1,
  },

  tabActive: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#241a0e',
    color: '#d4af37',
    border: 'none',
    borderBottom: '2px solid #d4af37',
    marginBottom: '-2px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
  tabInactive: {
    flex: 1,
    padding: '10px',
    backgroundColor: 'transparent',
    color: '#7a6a5a',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
  },

  // Panel de contenido
  panel: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  // Dados DUALITY
  diceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  diceFace: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  diceFaceInner: {
    width: 72,
    height: 72,
    borderRadius: '12px',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
  },
  diceNumber: {
    color: '#e8dcc8',
    fontSize: '2rem',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  dicePlaceholder: {
    color: '#4a3728',
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  diceLabel: {
    color: '#d4af37',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  diceSublabel: {
    color: '#7a6a5a',
    fontSize: '0.7rem',
  },
  plus: {
    color: '#7a6a5a',
    fontSize: '1.5rem',
    marginTop: '-20px',
  },

  // Ventaja
  advRow: {
    display: 'flex',
    gap: '10px',
  },
  advBtnAdv: {
    flex: 1,
    padding: '7px',
    backgroundColor: 'transparent',
    color: '#4caf50',
    border: '1px solid #4caf50',
    borderRadius: '5px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
  },
  advBtnDisadv: {
    flex: 1,
    padding: '7px',
    backgroundColor: 'transparent',
    color: '#ef5350',
    border: '1px solid #ef5350',
    borderRadius: '5px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
  },
  advBtnOn: {
    flex: 1,
    padding: '7px',
    backgroundColor: '#3a2a1a',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '5px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  advHint: {
    color: '#a0906a',
    fontSize: '0.78rem',
    fontStyle: 'italic',
    textAlign: 'center',
    margin: '-6px 0 0 0',
  },

  // Modificador
  modRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
  modLabel: {
    color: '#a0906a',
    fontSize: '0.85rem',
  },
  modControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  modBtn: {
    width: 30,
    height: 30,
    backgroundColor: '#241a0e',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
  },
  modInput: {
    width: 56,
    textAlign: 'center',
    backgroundColor: '#241a0e',
    color: '#e8dcc8',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },

  // Botón ROLL principal
  rollBtn: {
    padding: '12px',
    backgroundColor: '#8b1a1a',
    color: '#e8dcc8',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '1px',
    transition: 'background-color 0.15s ease',
  },
  rollBtnDisabled: {
    padding: '12px',
    backgroundColor: '#2a1e12',
    color: '#4a3728',
    border: '1px solid #3a2a1a',
    borderRadius: '6px',
    fontSize: '1.1rem',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },

  // Caja de resultado
  resultBox: {
    border: '1px solid',
    borderRadius: '6px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    animation: 'none',
  },
  totalRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  totalNumber: {
    color: '#e8dcc8',
    fontSize: '2.4rem',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  verdict: {
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  resultDetail: {
    color: '#a0906a',
    fontSize: '0.82rem',
    margin: 0,
  },

  // Paleta CUSTOM
  paletteLabel: {
    color: '#a0906a',
    fontSize: '0.82rem',
    margin: 0,
  },
  palette: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  diePaletteBtn: {
    padding: '8px 12px',
    backgroundColor: '#241a0e',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: 'border-color 0.1s ease',
    minWidth: '52px',
    textAlign: 'center',
  },

  // Cola de dados
  queueArea: {
    minHeight: '44px',
    backgroundColor: '#0d0905',
    border: '1px solid #2a1e12',
    borderRadius: '6px',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
  },
  queueEmpty: {
    color: '#4a3728',
    fontSize: '0.85rem',
    fontStyle: 'italic',
  },
  queueDisplay: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px',
  },
  queueDie: {
    backgroundColor: '#241a0e',
    color: '#d4af37',
    border: '1px solid #6a4a28',
    borderRadius: '4px',
    padding: '3px 8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.88rem',
    fontWeight: 'bold',
  },
  queuePlus: {
    color: '#4a3728',
    fontSize: '0.9rem',
  },

  // Acciones custom
  customActions: {
    display: 'flex',
    gap: '10px',
  },
  clearBtn: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: '#7a6a5a',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    flexShrink: 0,
  },

  // Footer
  footer: {
    padding: '8px 16px',
    borderTop: '1px solid #2a1e12',
    color: '#7a6a5a',
    fontSize: '0.75rem',
    textAlign: 'right',
  },
};
