import React from 'react';
import MarkdownText from './MarkdownText';
import { TYPE_COLORS } from './domainCardsConstants';
import { getCardRecoveryCost, getCardDomainName } from './CardSwapModal';

/**
 * DomainCardItem — Componente atómico para renderizar cualquier carta de juego:
 * - Soporta modos: 'active', 'vault', 'homebrew', 'traits'.
 * - Gestiona estados de selección y animación de juego.
 * - Inyecta botones de acción personalizables vía `children`.
 */
export default function DomainCardItem({
  card,
  mode = 'active',
  isSelected = false,
  isBeingPlayed = false,
  onClick,
  children,
}) {
  if (!card) return null;

  const colors = TYPE_COLORS[card.tipo] ?? TYPE_COLORS.default;
  const isVault = mode === 'vault';
  const isHomebrew = mode === 'homebrew';
  const recoveryCost = getCardRecoveryCost(card);
  const cardDom = getCardDomainName(card);

  // Borde y sombra adaptativos
  const borderColor = isVault
    ? '#3a2a1a'
    : isSelected
    ? '#d4af37'
    : colors.border;

  const boxShadow = isSelected
    ? '0 0 10px rgba(212, 175, 55, 0.45)'
    : isBeingPlayed
    ? `0 0 12px ${colors.border}80`
    : 'none';

  return (
    <div
      onClick={onClick}
      style={{
        ...styles.card,
        borderColor,
        backgroundColor: isVault ? '#120c07' : isHomebrew ? '#1e1c0c' : '#1c130b',
        boxShadow,
        transform: isBeingPlayed ? 'scale(0.97)' : 'scale(1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* Cabecera de la carta */}
      <div style={styles.cardHeader}>
        <span
          style={{
            ...styles.cardTitle,
            color: isVault ? '#8a7a60' : isHomebrew ? '#f5f0b8' : '#e8dcc8',
          }}
        >
          {card.titulo}
        </span>
        <div style={styles.badgesWrapper}>
          {cardDom && <span style={styles.domainTag}>{cardDom}</span>}
          <span
            style={{
              ...styles.typeBadge,
              backgroundColor: isVault ? '#2e2014' : colors.badge,
              color: isVault ? '#a0906a' : colors.badgeText,
              borderColor: isHomebrew ? colors.border : undefined,
            }}
          >
            {card.tipo}
          </span>
        </div>
      </div>

      {/* Fila de metadatos (Nivel, Coste de Recuperación o Subtítulo) */}
      <div style={styles.cardMetaRow}>
        <span style={{ ...styles.cardLevel, color: isVault ? '#6e5d48' : '#a0906a' }}>
          Nivel {card.nivel || 1}
        </span>

        {isVault && (
          <span style={styles.vaultRecoveryTag}>
            ⚡ Coste: <strong>{recoveryCost} Estrés</strong>
          </span>
        )}

        {mode === 'active' && (
          <span style={styles.recoveryTag} title="Coste de Recuperación al re-equipar">
            ⚡ Recup: {recoveryCost}
          </span>
        )}

        {isHomebrew && (
          <span style={{ fontSize: '0.74rem', color: '#dcd295', fontStyle: 'italic' }}>
            ✨ Modificador Externo
          </span>
        )}
      </div>

      {/* Descripción con soporte Markdown */}
      <div style={{ ...styles.cardBody, color: isVault ? '#8a7a60' : '#c8bba8' }}>
        <MarkdownText text={card.descripcion} />
      </div>

      {/* Botonera de acciones (inyectada por el contenedor) */}
      {children && <div style={styles.cardFooter}>{children}</div>}
    </div>
  );
}

const styles = {
  card: {
    border: '1px solid #4a3728',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '230px',
    boxSizing: 'border-box',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '0.98rem',
    fontWeight: 'bold',
    flex: '1 1 auto',
  },
  badgesWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  domainTag: {
    fontSize: '0.70rem',
    color: '#deb887',
    border: '1px solid #735028',
    borderRadius: '4px',
    padding: '1px 5px',
    backgroundColor: '#1b1207',
  },
  typeBadge: {
    fontSize: '0.72rem',
    borderRadius: '4px',
    padding: '2px 7px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  cardMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '0.76rem',
  },
  cardLevel: {
    fontWeight: 'bold',
  },
  recoveryTag: {
    color: '#d4af37',
    fontSize: '0.74rem',
  },
  vaultRecoveryTag: {
    color: '#b09060',
    fontSize: '0.73rem',
  },
  cardBody: {
    fontSize: '0.82rem',
    lineHeight: '1.45',
    flex: '1 1 auto',
    marginBottom: '10px',
  },
  cardFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: 'auto',
  },
};
