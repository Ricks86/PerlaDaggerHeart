import React from 'react';

/**
 * MiniCharacterSheet: Tarjeta de resumen compacta y de alta legibilidad
 * para el Monitor de Grupo del Dungeon Master (Sprint 13).
 */
export default function MiniCharacterSheet({ character, onRemove, onGift, onToggleLevelUp }) {
  if (!character) return null;

  const [internalPuedeSubir, setInternalPuedeSubir] = React.useState(character.puedeSubirNivel);

  React.useEffect(() => {
    setInternalPuedeSubir(character.puedeSubirNivel);
  }, [character.puedeSubirNivel]);

  const handleToggleClick = async (e) => {
    e?.stopPropagation();
    if (onToggleLevelUp) {
      onToggleLevelUp(character);
    } else {
      try {
        const res = await fetch(`/api/characters/${character.id}/toggle-level-up`, { method: 'PATCH' });
        if (res.ok) {
          const updated = await res.json();
          setInternalPuedeSubir(updated.puedeSubirNivel);
        }
      } catch (err) {
        console.error('Error toggling level up permission:', err);
      }
    }
  };

  const isLevelUpActive = character.puedeSubirNivel ?? internalPuedeSubir;
  const nivel = character.nivel || 1;
  const armadura = character.armaduraActiva;
  const armaPrinc = character.armaPrincipal;
  const armaSec = character.armaSecundaria;

  // Cálculo dinámico de umbrales según armadura y nivel
  const umbralMayor = armadura ? armadura.umbralMayorBase + nivel : null;
  const umbralGrave = armadura ? armadura.umbralGraveBase + nivel : null;
  const armorSlots = armadura ? armadura.puntuacionBase : 0;
  const ranurasMarcadas = character.ranurasArmaduraMarcadas || 0;

  // Porcentajes de barras de recursos
  const hpPercent = Math.min(100, Math.max(0, ((character.hpActual || 0) / (character.hpMax || 1)) * 100));
  const estresPercent = Math.min(100, Math.max(0, ((character.estresActual || 0) / (character.estresMax || 1)) * 100));
  const esperanzaPercent = Math.min(100, Math.max(0, ((character.esperanzaActual || 0) / (character.esperanzaMax || 1)) * 100));

  return (
    <div style={styles.cardContainer}>
      {/* ------------------------------------------------------------- */}
      {/* ENCABEZADO: Nombre, Nivel, Clase y botón Quitar                */}
      {/* ------------------------------------------------------------- */}
      <div style={styles.cardHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.nameRow}>
            <strong style={styles.heroName} title={character.nombre}>
              {character.nombre}
            </strong>
            <span style={styles.levelBadge}>Nv. {nivel}</span>
          </div>
          <div style={styles.tagsRow}>
            <span style={styles.classTag}>{character.clase}</span>
            {character.subclase && <span style={styles.subclassTag}>{character.subclase}</span>}
            {character.ancestro && <span style={styles.ancestryTag}>{character.ancestro}</span>}
          </div>
        </div>

        <div style={styles.headerRightActions}>
          {onRemove && (
            <button
              onClick={() => onRemove(character.id)}
              style={styles.btnRemove}
              title="Desanclar héroe del monitor"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BARRA DE ACCIONES DEL DJ: Subida de Nivel y Botín             */}
      {/* ------------------------------------------------------------- */}
      <div style={styles.dmActionsRow}>
        {nivel < 10 && (
          <button
            type="button"
            onClick={handleToggleClick}
            style={isLevelUpActive ? styles.btnLevelUpActive : styles.btnLevelUpDisabled}
            title={
              isLevelUpActive
                ? `Subida de nivel habilitada para ${character.nombre}. Clic para revocar el permiso.`
                : `Habilitar subida de nivel para ${character.nombre} (desbloquea Nivel ${nivel + 1})`
            }
          >
            {isLevelUpActive ? '⚡ Subida: Habilitada' : '🔒 Habilitar Subida'}
          </button>
        )}

        {onGift && (
          <button
            type="button"
            onClick={() => onGift(character)}
            style={styles.btnGift}
            title={`Entregar botín a ${character.nombre}`}
          >
            🎁 Dar Botín
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STATS DE PROTECCIÓN DESTACADOS: Evasión y Armadura            */}
      {/* ------------------------------------------------------------- */}
      <div style={styles.defenseRow}>
        <div style={styles.defenseBoxEvasion}>
          <span style={styles.defenseIcon}>🛡️</span>
          <div style={styles.defenseMeta}>
            <span style={styles.defenseLabel}>EVASIÓN</span>
            <strong style={styles.defenseValue}>{character.evasion ?? 10}</strong>
          </div>
        </div>

        <div style={styles.defenseBoxArmor}>
          <span style={styles.defenseIcon}>🦺</span>
          <div style={styles.defenseMeta}>
            <span style={styles.defenseLabel}>ARMADURA</span>
            <div style={styles.armorScoreRow}>
              <strong style={styles.defenseValue}>{armorSlots}</strong>
              <span
                style={ranurasMarcadas > 0 ? styles.armorMarkedTagBroken : styles.armorMarkedTagOk}
                title={`${ranurasMarcadas} de ${armorSlots} ranuras marcadas (desgastadas)`}
              >
                {ranurasMarcadas}/{armorSlots} gastadas
              </span>
            </div>
          </div>
          <span style={styles.armorNameMini} title={armadura?.nombre || 'Sin armadura'}>
            {armadura ? armadura.nombre : 'Sin armadura'}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RASTREADORES VITALES (HP, Estrés, Esperanza)                   */}
      {/* ------------------------------------------------------------- */}
      <div style={styles.trackersBlock}>
        {/* Puntos de Golpe (HP) */}
        <div style={styles.trackerRow}>
          <div style={styles.trackerHeader}>
            <span style={styles.trackerLabelHp}>❤️ HP:</span>
            <span style={styles.trackerNum}>
              <strong>{character.hpActual}</strong> / {character.hpMax}
            </span>
          </div>
          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFillHp,
                width: `${hpPercent}%`,
              }}
            />
          </div>
        </div>

        {/* Estrés */}
        <div style={styles.trackerRow}>
          <div style={styles.trackerHeader}>
            <span style={styles.trackerLabelStress}>😰 Estrés:</span>
            <span style={styles.trackerNum}>
              <strong>{character.estresActual}</strong> / {character.estresMax}
            </span>
          </div>
          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFillStress,
                width: `${estresPercent}%`,
              }}
            />
          </div>
        </div>

        {/* Esperanza */}
        <div style={styles.trackerRow}>
          <div style={styles.trackerHeader}>
            <span style={styles.trackerLabelHope}>✨ Esperanza:</span>
            <span style={styles.trackerNum}>
              <strong>{character.esperanzaActual}</strong> / {character.esperanzaMax}
            </span>
          </div>
          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFillHope,
                width: `${esperanzaPercent}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* UMBRALES DE DAÑO CALCULADOS (Menor, Mayor, Grave)             */}
      {/* ------------------------------------------------------------- */}
      <div style={styles.thresholdsBlock}>
        <span style={styles.thresholdsTitle}>Umbrales de Daño:</span>
        <div style={styles.thresholdsGrid}>
          <div style={styles.thresholdMinor}>
            <span style={styles.threshType}>Menor</span>
            <strong style={styles.threshVal}>
              {umbralMayor ? `< ${umbralMayor}` : '—'}
            </strong>
          </div>
          <div style={styles.thresholdMajor}>
            <span style={styles.threshType}>Mayor</span>
            <strong style={styles.threshVal}>
              {umbralMayor ? `${umbralMayor}+` : '—'}
            </strong>
          </div>
          <div style={styles.thresholdSevere}>
            <span style={styles.threshType}>Grave</span>
            <strong style={styles.threshVal}>
              {umbralGrave ? `≥ ${umbralGrave}` : '—'}
            </strong>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ARMAS EQUIPADAS                                                */}
      {/* ------------------------------------------------------------- */}
      <div style={styles.weaponsFooter}>
        <div style={styles.weaponItem} title={armaPrinc ? `${armaPrinc.nombre} (${armaPrinc.dadoBase})` : 'Sin arma principal'}>
          <span style={styles.weaponIcon}>⚔️</span>
          <span style={styles.weaponName}>
            {armaPrinc ? armaPrinc.nombre : 'Sin principal'}
          </span>
          {armaPrinc && (
            <span style={styles.weaponFormula}>
              {armaPrinc.rasgo ? `[${armaPrinc.rasgo}] ` : ''}
              {armaPrinc.dadoBase}{armaPrinc.modificadorDano >= 0 ? `+${armaPrinc.modificadorDano}` : armaPrinc.modificadorDano}
            </span>
          )}
        </div>

        {armaSec && (
          <div style={styles.weaponItem} title={`${armaSec.nombre} (${armaSec.dadoBase})`}>
            <span style={styles.weaponIcon}>🗡️</span>
            <span style={styles.weaponName}>{armaSec.nombre}</span>
            <span style={styles.weaponFormula}>
              {armaSec.rasgo ? `[${armaSec.rasgo}] ` : ''}
              {armaSec.dadoBase}{armaSec.modificadorDano >= 0 ? `+${armaSec.modificadorDano}` : armaSec.modificadorDano}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  cardContainer: {
    backgroundColor: '#150e06',
    border: '1px solid #4a3728',
    borderRadius: '8px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    transition: 'border-color 0.15s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #291d12',
    paddingBottom: '8px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflow: 'hidden',
    flex: 1,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  heroName: {
    color: '#d4af37',
    fontSize: '1.05rem',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  levelBadge: {
    backgroundColor: '#8b1a1a',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '3px',
    padding: '1px 5px',
    fontSize: '0.65rem',
    fontWeight: 'bold',
  },
  tagsRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  classTag: {
    backgroundColor: '#241a0e',
    color: '#e8dcc8',
    border: '1px solid #3d2c1d',
    borderRadius: '3px',
    padding: '1px 6px',
    fontSize: '0.68rem',
    fontWeight: 'bold',
  },
  subclassTag: {
    backgroundColor: '#1c140b',
    color: '#b0a08a',
    borderRadius: '3px',
    padding: '1px 6px',
    fontSize: '0.65rem',
  },
  ancestryTag: {
    backgroundColor: '#1c140b',
    color: '#9e8c75',
    borderRadius: '3px',
    padding: '1px 6px',
    fontSize: '0.65rem',
    fontStyle: 'italic',
  },
  headerRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  dmActionsRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    backgroundColor: '#1b1208',
    border: '1px solid #3d2a1b',
    borderRadius: '6px',
    padding: '6px 8px',
  },
  btnLevelUpActive: {
    flex: 1,
    backgroundColor: '#3a2b0a',
    color: '#ffea75',
    border: '1px solid #ffd700',
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.45)',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  btnLevelUpDisabled: {
    flex: 1,
    backgroundColor: '#26190f',
    color: '#d4c2a5',
    border: '1px solid #5a3d24',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  btnGift: {
    backgroundColor: '#2e1f0e',
    color: '#d4af37',
    border: '1px solid #5a3d24',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  btnRemove: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#7a5a4a',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '3px',
    transition: 'color 0.15s ease',
  },

  // Evasión y Armadura destacados
  defenseRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  defenseBoxEvasion: {
    backgroundColor: '#0a0704',
    border: '1px solid #3d2c1d',
    borderRadius: '5px',
    padding: '6px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  defenseBoxArmor: {
    backgroundColor: '#0a0704',
    border: '1px solid #204b7a',
    borderRadius: '5px',
    padding: '6px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    position: 'relative',
    overflow: 'hidden',
  },
  defenseIcon: {
    fontSize: '1.1rem',
  },
  defenseMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  defenseLabel: {
    color: '#7a6a5a',
    fontSize: '0.6rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  defenseValue: {
    color: '#d4af37',
    fontSize: '1.05rem',
    lineHeight: 1,
  },
  armorScoreRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    flexWrap: 'wrap',
  },
  armorMarkedTagOk: {
    backgroundColor: '#1b2a1a',
    color: '#7cd37c',
    border: '1px solid #3d6a3d',
    borderRadius: '3px',
    padding: '1px 5px',
    fontSize: '0.62rem',
    fontWeight: 'bold',
  },
  armorMarkedTagBroken: {
    backgroundColor: '#3a1a15',
    color: '#ff9a85',
    border: '1px solid #8b1a1a',
    borderRadius: '3px',
    padding: '1px 5px',
    fontSize: '0.62rem',
    fontWeight: 'bold',
  },
  armorNameMini: {
    position: 'absolute',
    right: '6px',
    bottom: '4px',
    color: '#557a9e',
    fontSize: '0.58rem',
    maxWidth: '65px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  // Rastreadores
  trackersBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    backgroundColor: '#0d0804',
    border: '1px solid #2a1e12',
    borderRadius: '6px',
    padding: '8px 10px',
  },
  trackerRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  trackerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.72rem',
  },
  trackerLabelHp: {
    color: '#ff8585',
    fontWeight: 'bold',
  },
  trackerLabelStress: {
    color: '#d4b068',
    fontWeight: 'bold',
  },
  trackerLabelHope: {
    color: '#7cd37c',
    fontWeight: 'bold',
  },
  trackerNum: {
    color: '#e8dcc8',
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: '#1b1208',
    borderRadius: '3px',
    overflow: 'hidden',
    border: '1px solid #2f1f12',
  },
  progressBarFillHp: {
    height: '100%',
    backgroundColor: '#c0392b',
    transition: 'width 0.3s ease',
  },
  progressBarFillStress: {
    height: '100%',
    backgroundColor: '#d4af37',
    transition: 'width 0.3s ease',
  },
  progressBarFillHope: {
    height: '100%',
    backgroundColor: '#27ae60',
    transition: 'width 0.3s ease',
  },

  // Umbrales de Daño
  thresholdsBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  thresholdsTitle: {
    color: '#7a6a5a',
    fontSize: '0.66rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  thresholdsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '4px',
  },
  thresholdMinor: {
    backgroundColor: '#101510',
    border: '1px solid #204020',
    borderRadius: '4px',
    padding: '3px 4px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  thresholdMajor: {
    backgroundColor: '#1d1508',
    border: '1px solid #5a4010',
    borderRadius: '4px',
    padding: '3px 4px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  thresholdSevere: {
    backgroundColor: '#1f0d0a',
    border: '1px solid #6b1f14',
    borderRadius: '4px',
    padding: '3px 4px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  threshType: {
    color: '#7a6a5a',
    fontSize: '0.58rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  threshVal: {
    color: '#e8dcc8',
    fontSize: '0.8rem',
  },

  // Pie con armas equipadas
  weaponsFooter: {
    borderTop: '1px solid #24160d',
    paddingTop: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  weaponItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.68rem',
    overflow: 'hidden',
  },
  weaponIcon: {
    fontSize: '0.72rem',
  },
  weaponName: {
    color: '#c4b59d',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
  },
  weaponFormula: {
    color: '#d4af37',
    fontSize: '0.65rem',
    whiteSpace: 'nowrap',
  },
};
