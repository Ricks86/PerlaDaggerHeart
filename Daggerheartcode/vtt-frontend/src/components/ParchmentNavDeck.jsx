import React, { useState } from 'react';

/**
 * Genera el estilo de papel antiguo envejecido para un botón de pergamino.
 */
function getParchmentBtnStyle(isSelected, isHovered) {
  return {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '12px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: "'Georgia', 'Garamond', 'Palatino Linotype', serif",
    transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
    userSelect: 'none',
    minHeight: '96px',
    boxSizing: 'border-box',
    outline: 'none',
    // Textura de papel antiguo con bordes desgastados
    border: isSelected ? '2px solid #d4af37' : isHovered ? '2px solid #a8793e' : '2px solid #7a5426',
    background: isSelected
      ? 'radial-gradient(ellipse at 50% 20%, rgba(255, 252, 240, 0.98) 0%, rgba(248, 235, 205, 0.95) 55%, rgba(228, 203, 155, 0.98) 100%)'
      : isHovered
      ? 'radial-gradient(ellipse at 50% 30%, rgba(250, 240, 220, 0.92) 0%, rgba(228, 205, 162, 0.88) 65%, rgba(198, 162, 112, 0.92) 100%)'
      : 'radial-gradient(ellipse at 50% 30%, rgba(240, 226, 198, 0.85) 0%, rgba(215, 190, 145, 0.8) 70%, rgba(180, 145, 95, 0.85) 100%)',
    boxShadow: isSelected
      ? 'inset 0 0 16px rgba(160, 95, 25, 0.45), 0 0 16px rgba(212, 175, 55, 0.65), 0 4px 12px rgba(0, 0, 0, 0.6)'
      : isHovered
      ? 'inset 0 0 12px rgba(115, 75, 25, 0.35), 0 6px 14px rgba(0, 0, 0, 0.5)'
      : 'inset 0 0 10px rgba(100, 60, 15, 0.35), 0 3px 6px rgba(0, 0, 0, 0.4)',
    transform: isSelected
      ? 'scale(1.02)'
      : isHovered
      ? 'translateY(-2px)'
      : 'scale(1)',
  };
}

/**
 * ParchmentNavDeck — Botonera de navegación en estilo pergamino antiguo.
 * Renderiza los 4 botones temáticos para alternar entre categorías de cartas.
 */
export default function ParchmentNavDeck({ tabs = [], activeTabId, onSelectTab }) {
  const [hoveredTabId, setHoveredTabId] = useState(null);

  return (
    <div className="domain-cards-parchment-deck" style={styles.navContainer}>
      {tabs.map((tab) => {
        const isSelected = activeTabId === tab.id;
        const isHovered = hoveredTabId === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab && onSelectTab(tab.id)}
            onMouseEnter={() => setHoveredTabId(tab.id)}
            onMouseLeave={() => setHoveredTabId(null)}
            style={getParchmentBtnStyle(isSelected, isHovered)}
            aria-pressed={isSelected}
          >
            {/* Marco interior punteado clásico de encuadernación */}
            <div style={styles.innerFrame}>
              <div style={styles.rowTop}>
                <span style={styles.emoji}>{tab.icon}</span>
                <span
                  style={{
                    ...styles.counterBadge,
                    backgroundColor: isSelected ? '#7a2216' : '#4a2f16',
                    color: isSelected ? '#fff2cc' : '#f0e3cc',
                    border: isSelected ? '1px solid #b84028' : '1px solid #734d28',
                  }}
                >
                  {tab.countText}
                </span>
              </div>

              <div style={styles.textWrap}>
                <div style={styles.mainTitle}>{tab.title}</div>
                <div style={styles.subTitle}>{tab.subtitle}</div>
              </div>

              <div style={styles.rowBottom}>
                {isSelected ? (
                  <span style={styles.activeStamp}>● ACTIVO</span>
                ) : (
                  <span style={styles.inactiveHint}>Pulsa para ver</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  navContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flexShrink: 0,
  },
  innerFrame: {
    border: '1px dashed rgba(110, 75, 30, 0.45)',
    padding: '6px 8px',
    borderRadius: '5px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  },
  rowTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  emoji: {
    fontSize: '1.3rem',
    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))',
  },
  counterBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
  },
  textWrap: {
    margin: '4px 0',
  },
  mainTitle: {
    fontSize: '0.96rem',
    fontWeight: '800',
    color: '#2a1a08',
    letterSpacing: '0.4px',
    textShadow: '0 1px 0 rgba(255,255,255,0.4)',
  },
  subTitle: {
    fontSize: '0.73rem',
    color: '#5e4320',
    marginTop: '2px',
    lineHeight: '1.2',
  },
  rowBottom: {
    marginTop: '6px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  activeStamp: {
    fontSize: '0.65rem',
    fontWeight: 'bold',
    color: '#7a2216',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  inactiveHint: {
    fontSize: '0.65rem',
    color: '#7d613c',
    fontStyle: 'italic',
  },
};
