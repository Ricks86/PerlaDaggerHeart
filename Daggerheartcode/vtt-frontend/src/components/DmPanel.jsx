import React from 'react';
import NpcManager from './NpcManager';
import DmRoller from './DmRoller';
import SharedRollLog from './SharedRollLog';

/**
 * DmPanel: Vista central y exclusiva del Dungeon Master (DJ).
 *
 * Agrupa:
 *  1. NpcManager: Creador y gestor del encuentro (HP, Estrés, Adversarios)
 *  2. DmRoller: Motor asimétrico de dados (1d20 para ataque, daño con regex)
 *  3. SharedRollLog: Historial en tiempo real de la mesa (sincronizado con jugadores)
 */
export default function DmPanel() {
  return (
    <div style={styles.container}>
      {/* Banner de Estado del DJ */}
      <div style={styles.dmBanner}>
        <div style={styles.bannerLeft}>
          <span style={styles.crownIcon}>👑</span>
          <div>
            <h2 style={styles.bannerTitle}>Pantalla del Dungeon Master</h2>
            <p style={styles.bannerSubtitle}>
              Control asimétrico de adversarios, tiradas de ataque d20 y cálculo de daño.
            </p>
          </div>
        </div>
        <div style={styles.bannerTag}>VISTA ASIMÉTRICA ACTIVA</div>
      </div>

      {/* Grid Principal del DJ */}
      <div style={styles.mainGrid}>
        {/* Columna Izquierda: Gestor de Adversarios y Encuentro */}
        <section style={styles.leftColumn}>
          <NpcManager />
        </section>

        {/* Columna Derecha: Dados del DJ + Chat/Historial de Mesa */}
        <section style={styles.rightColumn}>
          <DmRoller />
          <SharedRollLog />
        </section>
      </div>
    </div>
  );
}

// =============================================================================
// Estilos
// =============================================================================
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px 28px',
  },
  dmBanner: {
    backgroundColor: '#1c0f07',
    border: '1px solid #8b1a1a',
    borderRadius: '8px',
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    boxShadow: 'inset 0 0 20px rgba(139, 26, 26, 0.2)',
  },
  bannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  crownIcon: {
    fontSize: '2rem',
  },
  bannerTitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1.25rem',
    letterSpacing: '1px',
  },
  bannerSubtitle: {
    margin: 0,
    color: '#a0906a',
    fontSize: '0.8rem',
  },
  bannerTag: {
    backgroundColor: '#8b1a1a',
    color: '#e8dcc8',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(400px, 1fr) 380px',
    gap: '20px',
    alignItems: 'start',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: 0,
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'sticky',
    top: '16px',
  },
};
