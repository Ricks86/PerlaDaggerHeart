import React, { useState } from 'react';
import { useCharacter } from '../context/CharacterContext';
import { useWebSocket } from '../context/WebSocketContext';

/**
 * EquipmentManager: Versión compacta para la cabecera superior (Sprint 11.5).
 * Organiza en una fila las tarjetas de Armadura Activa, Arma Principal y Arma Secundaria,
 * junto a una columna de Inventario Rápido no equipado con scroll interno.
 */
export default function EquipmentManager() {
  const { character, setCharacter } = useCharacter();
  const { sendTableAction, connected } = useWebSocket();

  const [isPatching, setIsPatching] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [lastRoll, setLastRoll] = useState(null);

  if (!character) return null;

  const armaPrincipal = character.armaPrincipal;
  const armaSecundaria = character.armaSecundaria;
  const armaduraActiva = character.armaduraActiva;
  const inventario = Array.isArray(character.inventario)
    ? character.inventario
    : Array.from(character.inventario || []);

  // Regla de Carga (Burden): arma principal con carga 2 bloquea el slot secundario
  const isTwoHanded = armaPrincipal?.carga === 2;

  // Equipar objeto desde el inventario
  async function handleEquip(item, slot) {
    setIsPatching(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/characters/${character.id}/equipment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EQUIP',
          slot,
          itemId: item.id,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setCharacter(updated);
      setFeedbackMsg(`✓ ${item.nombre} equipado`);
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err) {
      console.error('[EquipmentManager] Error al equipar:', err);
      setFeedbackMsg(`⚠️ ${err.message}`);
    } finally {
      setIsPatching(false);
    }
  }

  // Desequipar objeto activo
  async function handleUnequip(slot, itemNombre) {
    setIsPatching(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/characters/${character.id}/equipment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UNEQUIP',
          slot,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setCharacter(updated);
      setFeedbackMsg(`✓ ${itemNombre} guardado`);
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err) {
      console.error('[EquipmentManager] Error al desequipar:', err);
      setFeedbackMsg(`⚠️ ${err.message}`);
    } finally {
      setIsPatching(false);
    }
  }

  // Motor de Daño Dinámico (Sprint 11 - Fase 3)
  function handleDamageRoll(arma) {
    if (!arma) return;

    const diceSides = parseInt(arma.dadoBase?.replace('d', ''), 10) || 8;
    const comp = Math.max(1, character.competencia || 1);

    const rolls = [];
    for (let i = 0; i < comp; i++) {
      rolls.push(Math.floor(Math.random() * diceSides) + 1);
    }

    const sum = rolls.reduce((acc, val) => acc + val, 0);
    const mod = arma.modificadorDano || 0;
    const total = sum + mod;
    const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
    const rollsStr = `[${rolls.join(', ')}]`;

    // Formato exacto requerido:
    // '[Nombre Personaje] tira daño con [Nombre Arma]: [Resultados Dados] + Modificador([X]) = [Total] de daño [tipoDano]'
    const chatMessage = `${character.nombre} tira daño con ${arma.nombre}: ${rollsStr} + Modificador(${modStr}) = ${total} de daño ${arma.tipoDano}`;

    sendTableAction('DAMAGE_ROLL', character.nombre, {
      result: chatMessage,
      weaponName: arma.nombre,
      rolls,
      modifier: mod,
      total,
      damageType: arma.tipoDano,
    });

    setLastRoll({
      weaponId: arma.id,
      text: chatMessage,
      total,
      rolls,
      modStr,
    });
  }

  return (
    <div style={styles.compactRoot}>
      {feedbackMsg && (
        <div style={styles.feedbackBanner}>
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div style={styles.mainContainer}>
        {/* ================================================================= */}
        {/* FILA DE SLOTS ACTIVOS (Armadura, Arma Principal, Arma Secundaria)   */}
        {/* ================================================================= */}
        <div style={styles.activeSlotsRow}>
          {/* Slot 1: Armadura Activa */}
          <div style={styles.slotCard}>
            <div style={styles.slotHeader}>
              <span style={styles.slotTitle}>🛡️ Armadura</span>
              {armaduraActiva && (
                <span style={styles.slotTier}>T{armaduraActiva.tier}</span>
              )}
            </div>

            {armaduraActiva ? (
              <div style={styles.slotBody}>
                <strong style={styles.slotItemName} title={armaduraActiva.nombre}>
                  {armaduraActiva.nombre}
                </strong>

                <div style={styles.slotStatsBlock}>
                  <div style={styles.statMiniLine}>
                    <span style={styles.statMiniLabel}>Ranuras:</span>
                    <span style={styles.statMiniVal}>{armaduraActiva.puntuacionBase}</span>
                  </div>
                  <div style={styles.statMiniLine}>
                    <span style={styles.statMiniLabel}>Umbrales:</span>
                    <span style={styles.statMiniVal}>
                      {armaduraActiva.umbralMayorBase}/{armaduraActiva.umbralGraveBase}
                    </span>
                  </div>
                </div>

                {armaduraActiva.rasgoEspecial && (
                  <div style={styles.miniTrait} title={armaduraActiva.rasgoEspecial}>
                    📜 {armaduraActiva.rasgoEspecial}
                  </div>
                )}

                <button
                  onClick={() => handleUnequip('armaduraActiva', armaduraActiva.nombre)}
                  disabled={isPatching}
                  style={styles.btnSmallUnequip}
                  title="Desequipar y enviar al inventario"
                >
                  ✕ Quitar
                </button>
              </div>
            ) : (
              <div style={styles.emptySlotBody}>
                <span style={styles.emptySlotIcon}>🛡️</span>
                <span style={styles.emptySlotLabel}>Sin Armadura</span>
              </div>
            )}
          </div>

          {/* Slot 2: Arma Principal */}
          <div style={styles.slotCard}>
            <div style={styles.slotHeader}>
              <span style={styles.slotTitle}>⚔️ Principal</span>
              {armaPrincipal && (
                <span
                  style={armaPrincipal.carga === 2 ? styles.burdenBadge2H : styles.burdenBadge1H}
                  title={armaPrincipal.carga === 2 ? 'Arma de dos manos' : 'Arma de una mano'}
                >
                  {armaPrincipal.carga === 2 ? '2M' : '1M'}
                </span>
              )}
            </div>

            {armaPrincipal ? (
              <div style={styles.slotBody}>
                <strong style={styles.slotItemName} title={armaPrincipal.nombre}>
                  {armaPrincipal.nombre}
                </strong>

                <div style={styles.weaponFormula}>
                  {armaPrincipal.rasgo && (
                    <span style={styles.traitBadge} title={`Rasgo: ${armaPrincipal.rasgo}`}>
                      [{armaPrincipal.rasgo}]
                    </span>
                  )}{' '}
                  🎲 {armaPrincipal.dadoBase}
                  {armaPrincipal.modificadorDano >= 0 ? `+${armaPrincipal.modificadorDano}` : armaPrincipal.modificadorDano}{' '}
                  <span style={styles.damageType}>{armaPrincipal.tipoDano}</span>
                </div>

                {/* Botón de Tirada de Daño */}
                <button
                  onClick={() => handleDamageRoll(armaPrincipal)}
                  disabled={!connected}
                  style={connected ? styles.btnDamage : styles.btnDamageDisabled}
                  title={`Tirar ${character.competencia || 1}${armaPrincipal.dadoBase}${armaPrincipal.modificadorDano >= 0 ? `+${armaPrincipal.modificadorDano}` : armaPrincipal.modificadorDano} de daño`}
                >
                  💥 Daño ({character.competencia || 1}{armaPrincipal.dadoBase}
                  {armaPrincipal.modificadorDano >= 0 ? `+${armaPrincipal.modificadorDano}` : armaPrincipal.modificadorDano})
                </button>

                {lastRoll?.weaponId === armaPrincipal.id && (
                  <div style={styles.lastRollMini} title={lastRoll.text}>
                    Total: <strong style={{ color: '#d4af37' }}>{lastRoll.total}</strong> ({armaPrincipal.tipoDano})
                  </div>
                )}

                <button
                  onClick={() => handleUnequip('armaPrincipal', armaPrincipal.nombre)}
                  disabled={isPatching}
                  style={styles.btnSmallUnequip}
                  title="Desequipar y enviar al inventario"
                >
                  ✕ Quitar
                </button>
              </div>
            ) : (
              <div style={styles.emptySlotBody}>
                <span style={styles.emptySlotIcon}>⚔️</span>
                <span style={styles.emptySlotLabel}>Sin Arma</span>
              </div>
            )}
          </div>

          {/* Slot 3: Arma Secundaria */}
          <div style={isTwoHanded ? styles.slotCardLocked : styles.slotCard}>
            <div style={styles.slotHeader}>
              <span style={styles.slotTitle}>🗡️ Secundaria</span>
              {isTwoHanded && <span style={styles.lockBadge}>🔒 2 Manos</span>}
            </div>

            {isTwoHanded ? (
              <div style={styles.lockedSlotBody}>
                <span style={styles.lockedIcon}>🔒</span>
                <span style={styles.lockedText}>Bloqueado por Carga 2</span>
              </div>
            ) : armaSecundaria ? (
              <div style={styles.slotBody}>
                <strong style={styles.slotItemName} title={armaSecundaria.nombre}>
                  {armaSecundaria.nombre}
                </strong>

                <div style={styles.weaponFormula}>
                  {armaSecundaria.rasgo && (
                    <span style={styles.traitBadge} title={`Rasgo: ${armaSecundaria.rasgo}`}>
                      [{armaSecundaria.rasgo}]
                    </span>
                  )}{' '}
                  🎲 {armaSecundaria.dadoBase}
                  {armaSecundaria.modificadorDano >= 0 ? `+${armaSecundaria.modificadorDano}` : armaSecundaria.modificadorDano}{' '}
                  <span style={styles.damageType}>{armaSecundaria.tipoDano}</span>
                </div>

                {/* Botón de Tirada de Daño */}
                <button
                  onClick={() => handleDamageRoll(armaSecundaria)}
                  disabled={!connected}
                  style={connected ? styles.btnDamage : styles.btnDamageDisabled}
                  title={`Tirar ${character.competencia || 1}${armaSecundaria.dadoBase}${armaSecundaria.modificadorDano >= 0 ? `+${armaSecundaria.modificadorDano}` : armaSecundaria.modificadorDano} de daño`}
                >
                  💥 Daño ({character.competencia || 1}{armaSecundaria.dadoBase}
                  {armaSecundaria.modificadorDano >= 0 ? `+${armaSecundaria.modificadorDano}` : armaSecundaria.modificadorDano})
                </button>

                {lastRoll?.weaponId === armaSecundaria.id && (
                  <div style={styles.lastRollMini} title={lastRoll.text}>
                    Total: <strong style={{ color: '#d4af37' }}>{lastRoll.total}</strong> ({armaSecundaria.tipoDano})
                  </div>
                )}

                <button
                  onClick={() => handleUnequip('armaSecundaria', armaSecundaria.nombre)}
                  disabled={isPatching}
                  style={styles.btnSmallUnequip}
                  title="Desequipar y enviar al inventario"
                >
                  ✕ Quitar
                </button>
              </div>
            ) : (
              <div style={styles.emptySlotBody}>
                <span style={styles.emptySlotIcon}>🗡️</span>
                <span style={styles.emptySlotLabel}>Sin Arma</span>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* INVENTARIO RÁPIDO NO EQUIPADO (Columna con scroll interno)         */}
        {/* ================================================================= */}
        <div style={styles.quickInventoryColumn}>
          <div style={styles.inventoryHeaderRow}>
            <span style={styles.inventoryTitle}>🎒 Inventario</span>
            <span style={styles.inventoryCountBadge}>{inventario.length}</span>
          </div>

          <div style={styles.inventoryScrollList}>
            {inventario.length === 0 ? (
              <div style={styles.emptyInventory}>
                <span style={styles.emptyInventoryText}>Inventario vacío</span>
              </div>
            ) : (
              inventario.map((item) => {
                const isArma = item.tipo === 'Arma';
                const isArmadura = item.tipo === 'Armadura';
                const isConsumible = item.tipo === 'Consumible';
                const isSecundariaBlocked = isArma && item.categoria === 'Secundaria' && isTwoHanded;

                return (
                  <div key={item.id} style={styles.inventoryItemRow}>
                    <div style={styles.itemMeta}>
                      <div style={styles.itemNameLine}>
                        <span style={styles.itemIcon}>
                          {isArma ? (item.categoria === 'Principal' ? '⚔️' : '🗡️') : isArmadura ? '🛡️' : '🧪'}
                        </span>
                        <span style={styles.itemRowName} title={item.nombre}>
                          {item.nombre}
                        </span>
                      </div>
                      <div style={styles.itemSubtext}>
                        {isArma && (
                          <span>
                            T{item.tier}
                            {item.rasgo ? ` • ${item.rasgo}` : ''} • {item.dadoBase}
                            {item.modificadorDano >= 0 ? `+${item.modificadorDano}` : item.modificadorDano} {item.tipoDano}
                          </span>
                        )}
                        {isArmadura && (
                          <span>
                            T{item.tier} • R:{item.puntuacionBase} (U:{item.umbralMayorBase}/{item.umbralGraveBase})
                          </span>
                        )}
                        {isConsumible && (
                          <span title={item.descripcion}>
                            {item.descripcion?.length > 25 ? `${item.descripcion.slice(0, 25)}…` : item.descripcion}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={styles.itemBtnGroup}>
                      {isArma && item.categoria === 'Principal' && (
                        <button
                          onClick={() => handleEquip(item, 'armaPrincipal')}
                          disabled={isPatching}
                          style={styles.btnEquipAction}
                          title="Equipar como Arma Principal"
                        >
                          + Princ
                        </button>
                      )}

                      {isArma && item.categoria === 'Secundaria' && (
                        <button
                          onClick={() => handleEquip(item, 'armaSecundaria')}
                          disabled={isPatching || isSecundariaBlocked}
                          style={isSecundariaBlocked ? styles.btnEquipActionDisabled : styles.btnEquipAction}
                          title={isSecundariaBlocked ? 'Bloqueado: arma de 2 manos equipada' : 'Equipar como Arma Secundaria'}
                        >
                          {isSecundariaBlocked ? '🔒' : '+ Sec'}
                        </button>
                      )}

                      {isArmadura && (
                        <button
                          onClick={() => handleEquip(item, 'armaduraActiva')}
                          disabled={isPatching}
                          style={styles.btnEquipAction}
                          title="Equipar Armadura"
                        >
                          + Armad
                        </button>
                      )}

                      {isConsumible && (
                        <span style={styles.consumableTag} title="Objeto consumible">
                          Listo
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  compactRoot: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    height: '100%',
  },
  feedbackBanner: {
    backgroundColor: '#2e1f0e',
    border: '1px solid #d4af37',
    color: '#d4af37',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '0.72rem',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  mainContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },

  // Slots de equipamiento activo
  activeSlotsRow: {
    display: 'flex',
    gap: '8px',
    flex: '1 1 380px',
  },
  slotCard: {
    backgroundColor: '#150f07',
    border: '1px solid #3d2c1d',
    borderRadius: '6px',
    padding: '8px 10px',
    flex: 1,
    minWidth: '115px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.5)',
  },
  slotCardLocked: {
    backgroundColor: '#120b06',
    border: '1px dashed #4a2215',
    borderRadius: '6px',
    padding: '8px 10px',
    flex: 1,
    minWidth: '115px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    opacity: 0.75,
  },
  slotHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    borderBottom: '1px solid #291d12',
    paddingBottom: '3px',
  },
  slotTitle: {
    color: '#7a6a5a',
    fontSize: '0.68rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  slotTier: {
    backgroundColor: '#2e1f0e',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '3px',
    padding: '1px 4px',
    fontSize: '0.6rem',
    fontWeight: 'bold',
  },
  burdenBadge1H: {
    backgroundColor: '#1b2a1a',
    color: '#7cd37c',
    border: '1px solid #3d6a3d',
    borderRadius: '3px',
    padding: '1px 4px',
    fontSize: '0.6rem',
    fontWeight: 'bold',
  },
  burdenBadge2H: {
    backgroundColor: '#3a1a15',
    color: '#ff9a85',
    border: '1px solid #7a2b20',
    borderRadius: '3px',
    padding: '1px 4px',
    fontSize: '0.6rem',
    fontWeight: 'bold',
  },
  lockBadge: {
    backgroundColor: '#3a1a15',
    color: '#ff8585',
    borderRadius: '3px',
    padding: '1px 4px',
    fontSize: '0.58rem',
    fontWeight: 'bold',
  },
  slotBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  slotItemName: {
    color: '#e8dcc8',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
  },
  slotStatsBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    margin: '2px 0',
  },
  statMiniLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.68rem',
  },
  statMiniLabel: {
    color: '#7a6a5a',
  },
  statMiniVal: {
    color: '#d4af37',
    fontWeight: 'bold',
  },
  miniTrait: {
    fontSize: '0.62rem',
    color: '#9e8c75',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontStyle: 'italic',
  },
  weaponFormula: {
    fontSize: '0.74rem',
    color: '#d4af37',
    fontWeight: 'bold',
    marginBottom: '2px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '3px',
  },
  traitBadge: {
    backgroundColor: '#26170a',
    color: '#e8c56e',
    border: '1px solid #5a3a1e',
    borderRadius: '3px',
    padding: '0 4px',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    letterSpacing: '0.3px',
    display: 'inline-block',
  },
  damageType: {
    fontSize: '0.64rem',
    color: '#7a6a5a',
    fontWeight: 'normal',
  },
  btnDamage: {
    backgroundColor: '#8b1a1a',
    color: '#f5e6c8',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    padding: '4px 6px',
    fontSize: '0.68rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
  },
  btnDamageDisabled: {
    backgroundColor: '#2e1c1c',
    color: '#6e5555',
    border: '1px solid #4a2e2e',
    borderRadius: '4px',
    padding: '4px 6px',
    fontSize: '0.68rem',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
  lastRollMini: {
    backgroundColor: '#0a0704',
    border: '1px solid #3d2c1d',
    borderRadius: '3px',
    padding: '2px 4px',
    fontSize: '0.62rem',
    color: '#c4b59d',
    textAlign: 'center',
  },
  btnSmallUnequip: {
    backgroundColor: 'transparent',
    color: '#a08575',
    border: '1px solid #3d2c1d',
    borderRadius: '3px',
    padding: '2px 4px',
    fontSize: '0.62rem',
    cursor: 'pointer',
    marginTop: 'auto',
    alignSelf: 'stretch',
    fontFamily: 'inherit',
  },
  emptySlotBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '12px 4px',
    gap: '4px',
  },
  emptySlotIcon: {
    fontSize: '1.2rem',
    opacity: 0.35,
  },
  emptySlotLabel: {
    color: '#554232',
    fontSize: '0.68rem',
    fontStyle: 'italic',
  },
  lockedSlotBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '12px 4px',
    gap: '4px',
  },
  lockedIcon: {
    fontSize: '1.2rem',
    opacity: 0.45,
  },
  lockedText: {
    color: '#8b4a3a',
    fontSize: '0.64rem',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  // Columna de Inventario Rápido
  quickInventoryColumn: {
    backgroundColor: '#150f07',
    border: '1px solid #3d2c1d',
    borderRadius: '6px',
    padding: '8px 10px',
    flex: '1 1 220px',
    maxWidth: '280px',
    minWidth: '200px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.5)',
  },
  inventoryHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    borderBottom: '1px solid #291d12',
    paddingBottom: '3px',
  },
  inventoryTitle: {
    color: '#7a6a5a',
    fontSize: '0.68rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  inventoryCountBadge: {
    backgroundColor: '#2e1f0e',
    color: '#d4af37',
    borderRadius: '10px',
    padding: '1px 6px',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    border: '1px solid #4a3728',
  },
  inventoryScrollList: {
    maxHeight: '135px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    paddingRight: '3px',
  },
  emptyInventory: {
    padding: '16px 4px',
    textAlign: 'center',
  },
  emptyInventoryText: {
    color: '#554232',
    fontSize: '0.7rem',
    fontStyle: 'italic',
  },
  inventoryItemRow: {
    backgroundColor: '#0d0804',
    border: '1px solid #2e1f13',
    borderRadius: '4px',
    padding: '4px 6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '6px',
  },
  itemMeta: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flex: 1,
  },
  itemNameLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  itemIcon: {
    fontSize: '0.7rem',
  },
  itemRowName: {
    color: '#e8dcc8',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemSubtext: {
    color: '#7a6a5a',
    fontSize: '0.6rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemBtnGroup: {
    display: 'flex',
    gap: '3px',
    flexShrink: 0,
  },
  btnEquipAction: {
    backgroundColor: '#2e1f0e',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '3px',
    padding: '2px 5px',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
  },
  btnEquipActionDisabled: {
    backgroundColor: '#19110a',
    color: '#554232',
    border: '1px solid #291a10',
    borderRadius: '3px',
    padding: '2px 5px',
    fontSize: '0.62rem',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
  consumableTag: {
    backgroundColor: '#1b2a1a',
    color: '#7cd37c',
    border: '1px solid #3d6a3d',
    borderRadius: '3px',
    padding: '2px 4px',
    fontSize: '0.6rem',
  },
};
