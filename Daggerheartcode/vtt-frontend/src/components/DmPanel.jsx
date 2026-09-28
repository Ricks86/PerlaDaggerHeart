import React, { useState } from 'react';
import NpcManager from './NpcManager';
import DmRoller from './DmRoller';
import SharedRollLog from './SharedRollLog';
import SystemCompendium from './SystemCompendium';
import DataImporter from './DataImporter';

/**
 * DmPanel: Vista central y exclusiva del Dungeon Master (DJ).
 *
 * Pestañas:
 *  - 'ENCOUNTER': Gestión de monstruos en combate (NpcManager + DmRoller)
 *  - 'COMPENDIUM': Creación y mantenimiento de cartas fundacionales
 *  - 'IMPORTER': Motor de importación masiva mediante archivo .json o texto
 * Mantiene acceso al SharedRollLog para seguir la mesa.
 */
export default function DmPanel() {
  const [activeTab, setActiveTab] = useState('ENCOUNTER'); // 'ENCOUNTER' | 'COMPENDIUM' | 'IMPORTER'

  return (
    <div style={styles.container}>
      {/* Banner de Estado del DJ */}
      <div style={styles.dmBanner}>
        <div style={styles.bannerLeft}>
          <span style={styles.crownIcon}>👑</span>
          <div>
            <h2 style={styles.bannerTitle}>Pantalla del Dungeon Master</h2>
            <p style={styles.bannerSubtitle}>
              Control asimétrico de adversarios, tiradas de ataque d20, daño, compendio e ingesta masiva.
            </p>
          </div>
        </div>
        <div style={styles.bannerTag}>VISTA ASIMÉTRICA ACTIVA</div>
      </div>

      {/* Selector de Herramientas del DJ */}
      <div style={styles.tabsNav}>
        <button
          onClick={() => setActiveTab('ENCOUNTER')}
          style={activeTab === 'ENCOUNTER' ? styles.tabBtnActive : styles.tabBtn}
        >
          💀 Encuentro y Combate
        </button>
        <button
          onClick={() => setActiveTab('COMPENDIUM')}
          style={activeTab === 'COMPENDIUM' ? styles.tabBtnActive : styles.tabBtn}
        >
          📚 Compendio del Sistema
        </button>
        <button
          onClick={() => setActiveTab('IMPORTER')}
          style={activeTab === 'IMPORTER' ? styles.tabBtnActive : styles.tabBtn}
        >
          📥 Ingesta Masiva (JSON)
        </button>
      </div>

      {/* Grid Principal del DJ */}
      <div style={styles.mainGrid}>
        {/* Contenido Principal según la pestaña seleccionada */}
        <section style={styles.leftColumn}>
          {activeTab === 'ENCOUNTER' && <NpcManager />}
          {activeTab === 'COMPENDIUM' && <SystemCompendium />}
          {activeTab === 'IMPORTER' && (
            <DataImporter onImportSuccess={() => setActiveTab('COMPENDIUM')} />
          )}
        </section>

        {/* Columna Derecha: Dados del DJ (en modo combate) + Chat en tiempo real */}
        <section style={styles.rightColumn}>
          {activeTab === 'ENCOUNTER' && <DmRoller />}

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
  tabsNav: {
    display: 'flex',
    gap: '10px',
    borderBottom: '2px solid #3a2a1a',
    paddingBottom: '2px',
  },
  tabBtn: {
    backgroundColor: 'transparent',
    color: '#a0906a',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '8px 16px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    backgroundColor: '#1c1108',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderBottom: '2px solid #d4af37',
    padding: '8px 16px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'default',
    fontFamily: 'inherit',
    borderRadius: '4px 4px 0 0',
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
