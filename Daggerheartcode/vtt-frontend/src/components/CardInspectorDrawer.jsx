import React from 'react';
import MarkdownText from './MarkdownText';

/**
 * CardInspectorDrawer: Visor lateral de detalle para cartas de dominio en LevelUpModal.
 * Permite examinar la descripción íntegra, costes y metadatos sin perder el contexto
 * de la subida de nivel.
 */
export default function CardInspectorDrawer({
  card,
  onClose,
  onSelect,
  isSelected = false,
  isAlreadyActive = false,
}) {
  if (!card) return null;

  let meta = {};
  if (card.metadata) {
    if (typeof card.metadata === 'string') {
      try {
        meta = JSON.parse(card.metadata);
      } catch (e) {
        meta = {};
      }
    } else if (typeof card.metadata === 'object') {
      meta = card.metadata;
    }
  }

  const domain = meta.dominio || card.dominio || card.tipo || 'Dominio';
  const subtype = meta.subtipo || meta.tipo || '';
  const recoveryCost = meta.coste_recuperacion || meta.recuperacion || null;

  return (
    <aside style={styles.drawer}>
      <style>{`
        @keyframes slideInDrawer {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Cabecera del Inspector */}
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <span style={styles.domainLevelTag}>
            {domain} · Nivel {card.nivel || 1}
          </span>
          <h3 style={styles.title}>{card.titulo}</h3>
          {(subtype || recoveryCost) && (
            <p style={styles.metaSubtitle}>
              {subtype ? `${subtype} ` : ''}
              {recoveryCost ? `• Coste de Recuperación: ${recoveryCost}` : ''}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={styles.closeBtn}
          title="Cerrar visor de detalles"
        >
          ✕
        </button>
      </div>

      {/* Contenido / Descripción completa */}
      <div style={styles.body}>
        <div style={styles.descSection}>
          <span style={styles.descHeading}>Habilidad y Efecto:</span>
          {card.descripcion ? (
            <MarkdownText text={card.descripcion} />
          ) : (
            <p style={styles.noDesc}>Sin descripción registrada.</p>
          )}
        </div>
      </div>

      {/* Acciones directas desde el visor */}
      <div style={styles.footer}>
        {isAlreadyActive ? (
          <div style={styles.activeNotice}>
            🔒 Esta carta ya se encuentra activa en tu ficha de personaje
          </div>
        ) : isSelected ? (
          <button
            type="button"
            disabled
            style={styles.btnSelected}
          >
            ✓ Carta ya seleccionada en el Paso 1
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSelect && onSelect(card)}
            style={styles.btnSelect}
          >
            ✓ Seleccionar esta carta
          </button>
        )}
      </div>
    </aside>
  );
}

const styles = {
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',
    width: '380px',
    maxWidth: '90vw',
    backgroundColor: '#120b05',
    borderLeft: '1px solid #8b6d28',
    zIndex: 40,
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-6px 0 25px rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    boxSizing: 'border-box',
    animation: 'slideInDrawer 0.22s ease-out forwards',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #3d2a1b',
    paddingBottom: '12px',
    marginBottom: '14px',
    gap: '12px',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  domainLevelTag: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#d4af37',
  },
  title: {
    margin: '3px 0',
    fontSize: '1.25rem',
    color: '#ffea75',
    letterSpacing: '0.5px',
    fontWeight: 'bold',
  },
  metaSubtitle: {
    margin: 0,
    fontSize: '0.74rem',
    color: '#a08b77',
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#a08b77',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'all 0.15s ease',
    lineHeight: 1,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  descSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  descHeading: {
    fontSize: '0.68rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#7a6a5a',
    fontWeight: 'bold',
  },
  noDesc: {
    color: '#7a6a5a',
    fontSize: '0.85rem',
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '14px',
    borderTop: '1px solid #3d2a1b',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  btnSelect: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#8b1a1a',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    color: '#ffea75',
    fontSize: '0.88rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
  },
  btnSelected: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#261b0c',
    border: '1px solid #ffd700',
    borderRadius: '6px',
    color: '#ffd700',
    fontSize: '0.88rem',
    fontWeight: 'bold',
    cursor: 'default',
    fontFamily: 'inherit',
  },
  activeNotice: {
    fontSize: '0.78rem',
    color: '#7a6a5a',
    backgroundColor: '#1b1207',
    border: '1px solid #3d2a1b',
    borderRadius: '5px',
    padding: '8px 10px',
    textAlign: 'center',
    fontStyle: 'italic',
  },
};
