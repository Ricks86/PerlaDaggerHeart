import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

/**
 * GlobalFearAndCountdownsBar:
 * Barra superior global para la Reserva de Miedo (Fear Pool) y los Relojes de Cuenta Atrás (Countdowns).
 * Visible para Jugadores (solo lectura / visualización) y para el Dungeon Master (con controles activos).
 */
export default function GlobalFearAndCountdownsBar({ isDm = false }) {
  const { tableState, connected } = useWebSocket();

  const fearPool = tableState?.fearPool ?? 0;
  const countdowns = Array.isArray(tableState?.countdowns) ? tableState.countdowns : [];

  // Pulso visual para jugadores cuando aumenta el Miedo
  const [isPulsing, setIsPulsing] = useState(false);
  const prevFearRef = useRef(fearPool);

  useEffect(() => {
    if (fearPool > prevFearRef.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1200);
      return () => clearTimeout(timer);
    }
    prevFearRef.current = fearPool;
  }, [fearPool]);

  // Modales / Popovers del DJ
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [spendAmount, setSpendAmount] = useState(2);
  const [spendMotivo, setSpendMotivo] = useState('');
  const [spendSilent, setSpendSilent] = useState(false);
  const [isSpending, setIsSpending] = useState(false);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newValorMax, setNewValorMax] = useState(4);
  const [newVisible, setNewVisible] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // ---------------------------------------------------------------------------
  // Acciones de Miedo (Solo DJ)
  // ---------------------------------------------------------------------------
  async function handleQuickFear(delta, silent = false) {
    try {
      await fetch('/api/table-state/fear', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delta,
          motivo: delta < 0 ? (silent ? '' : 'Gasto rápido') : '',
          silent,
        }),
      });
    } catch (err) {
      console.error('[GlobalFearBar] Error al modificar Miedo:', err);
    }
  }

  async function handleConsolidatedSpend(e) {
    e.preventDefault();
    if (spendAmount <= 0) return;
    setIsSpending(true);
    try {
      await fetch('/api/table-state/fear', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delta: -Math.abs(spendAmount),
          motivo: spendMotivo.trim(),
          silent: spendSilent,
        }),
      });
      setShowSpendModal(false);
      setSpendMotivo('');
      setSpendSilent(false);
    } catch (err) {
      console.error('[GlobalFearBar] Error al gastar Miedo consolidado:', err);
    } finally {
      setIsSpending(false);
    }
  }

  async function handleResetFearSilently() {
    if (!window.confirm('¿Vaciar toda la reserva de Miedo a 0 de forma silenciosa (sin avisar en chat)?')) return;
    try {
      await fetch('/api/table-state/fear', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 0, silent: true }),
      });
      setShowSpendModal(false);
    } catch (err) {
      console.error('[GlobalFearBar] Error al vaciar Miedo silenciosamente:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Acciones de Countdowns (Solo DJ)
  // ---------------------------------------------------------------------------
  async function handleCreateCountdown(e) {
    e.preventDefault();
    if (!newNombre.trim()) return;
    setIsCreating(true);
    try {
      await fetch('/api/table-state/countdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newNombre.trim(),
          valorMaximo: newValorMax,
          valorActual: newValorMax,
          visibleParaJugadores: newVisible,
        }),
      });
      setShowNewModal(false);
      setNewNombre('');
      setNewValorMax(4);
      setNewVisible(true);
    } catch (err) {
      console.error('[GlobalFearBar] Error al crear reloj:', err);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateCountdownDelta(id, delta) {
    try {
      await fetch(`/api/table-state/countdowns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
    } catch (err) {
      console.error('[GlobalFearBar] Error al actualizar reloj:', err);
    }
  }

  async function handleToggleVisibility(id, currentVisible) {
    try {
      await fetch(`/api/table-state/countdowns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibleParaJugadores: !currentVisible }),
      });
    } catch (err) {
      console.error('[GlobalFearBar] Error al alternar visibilidad:', err);
    }
  }

  async function handleAnnounceCountdown(id) {
    try {
      await fetch(`/api/table-state/countdowns/${id}/announce`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('[GlobalFearBar] Error al anunciar reloj:', err);
    }
  }

  async function handleDeleteCountdown(id, nombre) {
    if (!window.confirm(`¿Eliminar el reloj "${nombre}"?`)) return;
    try {
      await fetch(`/api/table-state/countdowns/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('[GlobalFearBar] Error al eliminar reloj:', err);
    }
  }

  // Filtrado de relojes: los jugadores solo ven los visibles; el DJ ve todos
  const displayedCountdowns = isDm
    ? countdowns
    : countdowns.filter((cd) => cd.visibleParaJugadores);

  return (
    <div style={styles.barContainer}>
      {/* ------------------------------------------------------------ */}
      {/* SECCIÓN IZQUIERDA: RESERVA DE MIEDO                         */}
      {/* ------------------------------------------------------------ */}
      <div
        style={{
          ...styles.fearSection,
          ...(isPulsing ? styles.fearSectionPulse : {}),
        }}
      >
        <div style={styles.fearHeader}>
          <span style={styles.fearSkullIcon}>💀</span>
          <span style={styles.fearLabel}>RESERVA DE MIEDO</span>
          <span style={styles.fearNumberBadge}>{fearPool}</span>
          {fearPool >= 12 && (
            <span style={styles.fearMaxTag} title="Límite estándar recomendado alcanzado (12)">
              ⚠️ MAX
            </span>
          )}
        </div>

        {/* Fichas visuales de Miedo */}
        <div style={styles.fearTokensRow} title={`Reserva de Miedo: ${fearPool} puntos`}>
          {Array.from({ length: Math.min(12, Math.max(1, fearPool)) }).map((_, idx) => (
            <span
              key={idx}
              style={{
                ...styles.fearToken,
                opacity: idx < fearPool ? 1 : 0.25,
                transform: idx < fearPool ? 'scale(1)' : 'scale(0.85)',
              }}
            >
              🔥
            </span>
          ))}
          {fearPool > 12 && (
            <span style={styles.fearOverflow}>+{fearPool - 12}</span>
          )}
        </div>

        {/* Controles del DJ */}
        {isDm && (
          <div style={styles.dmFearControls}>
            <button
              onClick={() => handleQuickFear(-1, false)}
              disabled={fearPool <= 0}
              style={fearPool <= 0 ? styles.btnFearDisabled : styles.btnFearSpend}
              title="Gastar 1 punto de Miedo (anunciar en chat)"
            >
              -1 🔥
            </button>
            <button
              onClick={() => handleQuickFear(-1, true)}
              disabled={fearPool <= 0}
              style={fearPool <= 0 ? styles.btnFearDisabled : styles.btnFearSilent}
              title="Quitar 1 punto de Miedo silenciosamente (sin avisar en chat)"
            >
              -1 🤫
            </button>
            <button
              onClick={() => { setSpendSilent(false); setShowSpendModal(true); }}
              disabled={fearPool <= 0}
              style={fearPool <= 0 ? styles.btnFearDisabled : styles.btnFearSpendMulti}
              title="Gastar varios puntos de Miedo (con opciones y modo silencioso)"
            >
              -X 🔥
            </button>
            <button
              onClick={() => handleQuickFear(1)}
              style={styles.btnFearAdd}
              title="Añadir 1 punto de Miedo a la reserva"
            >
              +1 💀
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------ */}
      {/* SECCIÓN DERECHA: RELOJES DE CUENTA ATRÁS                    */}
      {/* ------------------------------------------------------------ */}
      <div style={styles.countdownsSection}>
        <div style={styles.countdownsHeader}>
          <span style={styles.countdownsTitle}>⏳ RELOJES DE CUENTA ATRÁS</span>
          {isDm && (
            <button
              onClick={() => setShowNewModal(true)}
              style={styles.btnNewCountdown}
              title="Crear un nuevo reloj de peligro o progreso"
            >
              + Nuevo Reloj
            </button>
          )}
        </div>

        <div style={styles.countdownsList}>
          {displayedCountdowns.length === 0 ? (
            <span style={styles.emptyCountdownsText}>
              {isDm ? 'No hay relojes activos. ¡Crea uno con "+ Nuevo Reloj"!' : 'No hay relojes de peligro visibles.'}
            </span>
          ) : (
            displayedCountdowns.map((cd) => {
              const isTriggered = cd.valorActual === 0;
              return (
                <div
                  key={cd.id}
                  style={{
                    ...styles.countdownPill,
                    ...(isTriggered ? styles.countdownPillTriggered : {}),
                  }}
                >
                  <div style={styles.countdownMetaRow}>
                    <span style={styles.countdownIcon}>
                      {isTriggered ? '💥' : '⏳'}
                    </span>
                    <strong style={styles.countdownName} title={cd.nombre}>
                      {cd.nombre}
                    </strong>

                    {/* Visibilidad (Solo DJ) */}
                    {isDm && (
                      <button
                        onClick={() => handleToggleVisibility(cd.id, cd.visibleParaJugadores)}
                        style={styles.btnVisibilityToggle}
                        title={cd.visibleParaJugadores ? 'Visible para jugadores (Clic para ocultar)' : 'Oculto para jugadores (Clic para revelar)'}
                      >
                        {cd.visibleParaJugadores ? '👁️' : '🙈'}
                      </button>
                    )}

                    {/* Fracción de progreso */}
                    <span style={isTriggered ? styles.fractionTriggered : styles.fraction}>
                      {isTriggered ? '¡ACTIVADO!' : `[ ${cd.valorActual} / ${cd.valorMaximo} ]`}
                    </span>

                    {/* Botón Borrar (Solo DJ) */}
                    {isDm && (
                      <button
                        onClick={() => handleDeleteCountdown(cd.id, cd.nombre)}
                        style={styles.btnDeleteCountdown}
                        title="Eliminar este reloj"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Barra de progreso visual con casillas */}
                  <div style={styles.boxesRow}>
                    {Array.from({ length: cd.valorMaximo }).map((_, boxIdx) => {
                      const isFilled = boxIdx < cd.valorActual;
                      return (
                        <div
                          key={boxIdx}
                          style={{
                            ...styles.boxTick,
                            backgroundColor: isFilled
                              ? (isTriggered ? '#ef4444' : '#d4af37')
                              : '#241a0e',
                            borderColor: isFilled ? '#f59e0b' : '#4a3728',
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Controles DJ por reloj */}
                  {isDm && (
                    <div style={styles.countdownDmControls}>
                      <button
                        onClick={() => handleUpdateCountdownDelta(cd.id, -1)}
                        disabled={cd.valorActual <= 0}
                        style={cd.valorActual <= 0 ? styles.btnDeltaDisabled : styles.btnDelta}
                        title="Avanzar reloj (-1)"
                      >
                        −1
                      </button>
                      <button
                        onClick={() => handleUpdateCountdownDelta(cd.id, 1)}
                        disabled={cd.valorActual >= cd.valorMaximo}
                        style={cd.valorActual >= cd.valorMaximo ? styles.btnDeltaDisabled : styles.btnDelta}
                        title="Retroceder reloj (+1)"
                      >
                        +1
                      </button>

                      {/* Anunciar en chat si está en 0 o es secreto */}
                      {(isTriggered || !cd.visibleParaJugadores) && (
                        <button
                          onClick={() => handleAnnounceCountdown(cd.id)}
                          style={styles.btnAnnounce}
                          title="Anunciar activación en el Historial de Mesa"
                        >
                          📢 Anunciar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* MODAL: Gasto Consolidado de Miedo (-X 🔥)                   */}
      {/* ------------------------------------------------------------ */}
      {showSpendModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>🔥 Gastar Miedo (Dungeon Master)</h4>
              <button onClick={() => setShowSpendModal(false)} style={styles.modalCloseBtn}>✕</button>
            </div>
            <form onSubmit={handleConsolidatedSpend} style={styles.modalForm}>
              <label style={styles.formLabel}>
                Cantidad a Gastar:
                <div style={styles.quickChipRow}>
                  {[1, 2, 3, 4, 5].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setSpendAmount(qty)}
                      style={{
                        ...styles.qtyChip,
                        ...(spendAmount === qty ? styles.qtyChipActive : {}),
                      }}
                      disabled={qty > fearPool}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, fearPool)}
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(parseInt(e.target.value, 10) || 1)}
                  style={styles.formInput}
                  required
                />
              </label>

              <label style={styles.formLabel}>
                Motivo / Habilidad (Opcional):
                <input
                  type="text"
                  placeholder="Ej. Invocación de Espectros, Movimiento de Miedo"
                  value={spendMotivo}
                  onChange={(e) => setSpendMotivo(e.target.value)}
                  style={styles.formInput}
                />
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={spendSilent}
                  onChange={(e) => setSpendSilent(e.target.checked)}
                  style={styles.checkboxInput}
                />
                <span>🤫 Modo silencioso (quitar sin notificar en el Historial de Mesa)</span>
              </label>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={handleResetFearSilently}
                  style={styles.btnResetAll}
                  title="Vaciar la reserva completa de Miedo a 0 sin notificar al chat"
                >
                  🗑️ Vaciar a 0
                </button>
                <button
                  type="button"
                  onClick={() => setShowSpendModal(false)}
                  style={styles.btnCancel}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSpending || spendAmount > fearPool}
                  style={styles.btnSubmit}
                >
                  {isSpending ? 'Gastando...' : (spendSilent ? `Quitar ${spendAmount} Silenciosamente` : `Confirmar Gasto de ${spendAmount} Miedo`)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* MODAL: Crear Nuevo Reloj (+ Nuevo Reloj)                     */}
      {/* ------------------------------------------------------------ */}
      {showNewModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>⏳ Crear Reloj de Cuenta Atrás</h4>
              <button onClick={() => setShowNewModal(false)} style={styles.modalCloseBtn}>✕</button>
            </div>
            <form onSubmit={handleCreateCountdown} style={styles.modalForm}>
              <label style={styles.formLabel}>
                Nombre del Reloj:
                <input
                  type="text"
                  placeholder="Ej. Refuerzos de la Guardia, Inundación del Templo"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  style={styles.formInput}
                  required
                  autoFocus
                />
              </label>

              <label style={styles.formLabel}>
                Segmentos / Valor Inicial:
                <div style={styles.quickChipRow}>
                  {[4, 6, 8, 10, 12].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewValorMax(preset)}
                      style={{
                        ...styles.qtyChip,
                        ...(newValorMax === preset ? styles.qtyChipActive : {}),
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newValorMax}
                  onChange={(e) => setNewValorMax(parseInt(e.target.value, 10) || 4)}
                  style={styles.formInput}
                  required
                />
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={newVisible}
                  onChange={(e) => setNewVisible(e.target.checked)}
                  style={styles.checkboxInput}
                />
                <span>Visible para los Jugadores (desmarcar para reloj secreto del DJ)</span>
              </label>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  style={styles.btnCancel}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newNombre.trim()}
                  style={styles.btnSubmit}
                >
                  {isCreating ? 'Creando...' : 'Crear Reloj'}
                </button>
              </div>
            </form>
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
  barContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '8px 24px',
    backgroundColor: '#120b17',
    borderBottom: '2px solid #3c1e4d',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    alignItems: 'stretch',
    position: 'relative',
    zIndex: 10,
  },

  // ---------------------------------------------------------------------------
  // Sección Fear Pool
  // ---------------------------------------------------------------------------
  fearSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px 14px',
    backgroundColor: '#1c0c26',
    border: '1px solid #6b21a8',
    borderRadius: '8px',
    boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
    flex: '0 0 auto',
    minWidth: '240px',
    transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
  },
  fearSectionPulse: {
    borderColor: '#c084fc',
    boxShadow: '0 0 18px #a855f7, inset 0 0 10px rgba(168, 85, 247, 0.4)',
  },
  fearHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  fearSkullIcon: {
    fontSize: '1.05rem',
  },
  fearLabel: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    letterSpacing: '1px',
    color: '#e9d5ff',
    textTransform: 'uppercase',
  },
  fearNumberBadge: {
    marginLeft: 'auto',
    backgroundColor: '#581c87',
    color: '#fae8ff',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    padding: '2px 8px',
    borderRadius: '12px',
    border: '1px solid #a855f7',
  },
  fearMaxTag: {
    fontSize: '0.62rem',
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
    padding: '1px 4px',
    borderRadius: '4px',
    fontWeight: 'bold',
  },
  fearTokensRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    overflow: 'hidden',
    minHeight: '20px',
  },
  fearToken: {
    fontSize: '0.85rem',
    display: 'inline-block',
    transition: 'transform 0.2s ease, opacity 0.2s ease',
  },
  fearOverflow: {
    fontSize: '0.7rem',
    color: '#f43f5e',
    fontWeight: 'bold',
    marginLeft: '4px',
  },
  dmFearControls: {
    display: 'flex',
    gap: '5px',
    marginTop: '4px',
  },
  btnFearSpend: {
    backgroundColor: '#4c1d95',
    color: '#f3e8ff',
    border: '1px solid #7c3aed',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  btnFearSilent: {
    backgroundColor: '#1e1b4b',
    color: '#a5b4fc',
    border: '1px solid #4338ca',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  btnFearSpendMulti: {
    backgroundColor: '#581c87',
    color: '#f5d0fe',
    border: '1px solid #9333ea',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  btnFearAdd: {
    backgroundColor: '#2e1065',
    color: '#d8b4fe',
    border: '1px solid #6b21a8',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  btnFearDisabled: {
    backgroundColor: '#1e1b2e',
    color: '#6b7280',
    border: '1px solid #374151',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '0.72rem',
    cursor: 'not-allowed',
  },

  // ---------------------------------------------------------------------------
  // Sección Countdowns
  // ---------------------------------------------------------------------------
  countdownsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: '1 1 450px',
    minWidth: '280px',
    justifyContent: 'center',
  },
  countdownsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdownsTitle: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    letterSpacing: '1px',
    color: '#d4af37',
    textTransform: 'uppercase',
  },
  btnNewCountdown: {
    backgroundColor: '#241a0e',
    color: '#d4af37',
    border: '1px solid #78521a',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  countdownsList: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '2px',
    alignItems: 'center',
  },
  emptyCountdownsText: {
    fontSize: '0.75rem',
    color: '#7a6a5a',
    fontStyle: 'italic',
  },
  countdownPill: {
    backgroundColor: '#171109',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    padding: '6px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '180px',
    maxWidth: '260px',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  },
  countdownPillTriggered: {
    borderColor: '#ef4444',
    backgroundColor: '#2b0c0c',
    boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)',
    animation: 'pulse 1.2s infinite alternate',
  },
  countdownMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  countdownIcon: {
    fontSize: '0.85rem',
  },
  countdownName: {
    color: '#f5e6c8',
    fontSize: '0.76rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
  },
  btnVisibilityToggle: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '0 2px',
  },
  fraction: {
    color: '#d4af37',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  fractionTriggered: {
    color: '#fca5a5',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  btnDeleteCountdown: {
    background: 'none',
    border: 'none',
    color: '#8b4a3a',
    cursor: 'pointer',
    fontSize: '0.75rem',
    padding: '0 3px',
    fontWeight: 'bold',
  },
  boxesRow: {
    display: 'flex',
    gap: '3px',
    height: '6px',
    marginTop: '2px',
  },
  boxTick: {
    flex: 1,
    borderRadius: '2px',
    border: '1px solid',
    transition: 'background-color 0.2s ease',
  },
  countdownDmControls: {
    display: 'flex',
    gap: '4px',
    marginTop: '4px',
    alignItems: 'center',
  },
  btnDelta: {
    backgroundColor: '#2e1f0e',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '3px',
    padding: '1px 6px',
    fontSize: '0.68rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  btnDeltaDisabled: {
    backgroundColor: '#150f07',
    color: '#554232',
    border: '1px solid #291d12',
    borderRadius: '3px',
    padding: '1px 6px',
    fontSize: '0.68rem',
    cursor: 'not-allowed',
  },
  btnAnnounce: {
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
    border: '1px solid #dc2626',
    borderRadius: '3px',
    padding: '1px 6px',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginLeft: 'auto',
  },

  // ---------------------------------------------------------------------------
  // Modales
  // ---------------------------------------------------------------------------
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#1a1208',
    border: '2px solid #6b21a8',
    borderRadius: '8px',
    padding: '20px',
    maxWidth: '420px',
    width: '90%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
    color: '#f5e6c8',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    borderBottom: '1px solid #3c1e4d',
    paddingBottom: '8px',
  },
  modalTitle: {
    margin: 0,
    color: '#e9d5ff',
    fontSize: '1rem',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#a855f7',
    fontSize: '1.1rem',
    cursor: 'pointer',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '0.8rem',
    color: '#d4af37',
  },
  formInput: {
    backgroundColor: '#0d0804',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    color: '#f5e6c8',
    padding: '6px 10px',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
  },
  quickChipRow: {
    display: 'flex',
    gap: '6px',
  },
  qtyChip: {
    backgroundColor: '#2e1f0e',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '3px 10px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  qtyChipActive: {
    backgroundColor: '#6b21a8',
    color: '#fae8ff',
    borderColor: '#c084fc',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
    color: '#c4b59d',
    cursor: 'pointer',
  },
  checkboxInput: {
    cursor: 'pointer',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '10px',
    marginTop: '6px',
  },
  btnResetAll: {
    backgroundColor: '#450a0a',
    color: '#fca5a5',
    border: '1px solid #991b1b',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginRight: 'auto',
  },
  btnCancel: {
    backgroundColor: 'transparent',
    color: '#a89885',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  btnSubmit: {
    backgroundColor: '#6b21a8',
    color: '#f5e6c8',
    border: '1px solid #a855f7',
    borderRadius: '4px',
    padding: '6px 14px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};
