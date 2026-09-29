import React, { useState } from 'react';
import { WebSocketProvider } from './context/WebSocketContext';
import { CharacterProvider, useCharacter } from './context/CharacterContext';
import { DiceProvider } from './context/DiceContext';
import { DmProvider } from './context/DmContext';

// Componentes del Jugador
import CharacterHeader from './components/CharacterHeader';
import DiceRoller from './components/DiceRoller';
import ResourceTracker from './components/ResourceTracker';
import CardVault from './components/CardVault';
import SharedRollLog from './components/SharedRollLog';
import PlayerDashboard from './components/PlayerDashboard';
import CharacterCreator from './components/CharacterCreator';

// Componentes del Dungeon Master
import DmPanel from './components/DmPanel';
import DmLogin from './components/DmLogin';

/**
 * AppContent: Maneja la navegación global entre el Lobby del Jugador,
 * el Creador de Personajes, la Mesa de Juego y la Pantalla del DJ.
 */
function AppContent() {
  const [viewMode, setViewMode] = useState('PLAYER'); // 'PLAYER' | 'DM'
  const [playerSubView, setPlayerSubView] = useState('DASHBOARD'); // 'DASHBOARD' | 'GAME' | 'CREATOR'
  const [isAuthenticatedAsDm, setIsAuthenticatedAsDm] = useState(false);
  const { character, selectCharacter } = useCharacter();

  return (
    <div style={styles.appContainer}>
      {/* ------------------------------------------------------------ */}
      {/* Header Principal con Selector de Rol y Vistas               */}
      {/* ------------------------------------------------------------ */}
      <header style={styles.appHeader}>
        <div style={styles.brandRow}>
          <h1 style={styles.logo}>⚔️ Daggerheart VTT</h1>
          <p style={styles.subtitle}>Mesa Virtual Ligera</p>
        </div>

        {/* Enrutador de Vistas */}
        <nav style={styles.viewSwitcher}>
          {viewMode === 'PLAYER' && (
            <>
              <button
                onClick={() => setPlayerSubView('DASHBOARD')}
                style={playerSubView === 'DASHBOARD' ? styles.tabBtnActive : styles.tabBtn}
              >
                👥 Mis Héroes
              </button>
              <button
                onClick={() => setPlayerSubView('GAME')}
                style={playerSubView === 'GAME' ? styles.tabBtnActive : styles.tabBtn}
              >
                ⚔️ Mesa de Juego {character ? `(${character.nombre})` : ''}
              </button>
            </>
          )}

          <button
            onClick={() => setViewMode(viewMode === 'DM' ? 'PLAYER' : 'DM')}
            style={viewMode === 'DM' ? styles.tabBtnDmActive : styles.tabBtn}
          >
            👑 {viewMode === 'DM' ? 'Volver a Jugador' : 'Vista DJ'}
          </button>

          {isAuthenticatedAsDm && viewMode === 'DM' && (
            <button
              onClick={() => {
                setIsAuthenticatedAsDm(false);
                setViewMode('PLAYER');
              }}
              style={styles.lockBtn}
              title="Cerrar sesión de Dungeon Master y bloquear"
            >
              🔒 Bloquear
            </button>
          )}
        </nav>
      </header>

      {/* ------------------------------------------------------------ */}
      {/* VISTA DEL JUGADOR: DASHBOARD vs GAME vs CREATOR             */}
      {/* ------------------------------------------------------------ */}
      {viewMode === 'PLAYER' && (
        <main style={styles.playerMain}>
          {/* Subvista 1: Lobby de Personajes */}
          {playerSubView === 'DASHBOARD' && (
            <PlayerDashboard
              onSelectHero={() => setPlayerSubView('GAME')}
              onCreateHero={() => setPlayerSubView('CREATOR')}
            />
          )}

          {/* Subvista 2: Forja de Héroes (Wizard) */}
          {playerSubView === 'CREATOR' && (
            <CharacterCreator
              onComplete={(newHero) => {
                selectCharacter(newHero);
                setPlayerSubView('GAME');
              }}
              onCancel={() => setPlayerSubView('DASHBOARD')}
            />
          )}

          {/* Subvista 3: Mesa de Juego Principal */}
          {playerSubView === 'GAME' && (
            <>
              {/* Ficha del personaje + atributos clickeables */}
              <section style={styles.characterSection}>
                <CharacterHeader />
              </section>

              {/* Área de juego: Recursos | Dados | Historial */}
              <div style={styles.gameArea}>
                <aside style={styles.leftColumn}>
                  <ResourceTracker />
                </aside>

                <div style={styles.centerColumn}>
                  <DiceRoller />
                </div>

                <aside style={styles.rightColumn}>
                  <SharedRollLog />
                </aside>
              </div>


              {/* Bóveda y Mano Activa de cartas */}
              <section style={styles.cardSection}>
                <CardVault />
              </section>
            </>
          )}
        </main>
      )}

      {/* ------------------------------------------------------------ */}
      {/* VISTA DEL DUNGEON MASTER (Protegida por PIN)                 */}
      {/* ------------------------------------------------------------ */}
      {viewMode === 'DM' && (
        <main style={styles.dmMain}>
          {isAuthenticatedAsDm ? (
            <DmPanel />
          ) : (
            <DmLogin
              onLoginSuccess={() => setIsAuthenticatedAsDm(true)}
              onCancel={() => setViewMode('PLAYER')}
            />
          )}
        </main>
      )}

      {/* ------------------------------------------------------------ */}
      {/* Footer                                                         */}
      {/* ------------------------------------------------------------ */}
      <footer style={styles.footer}>
        Sprint 14 · Filtrado del Historial de Mesa · Reestructuración de Proporciones · Party Monitor
      </footer>
    </div>
  );
}

/**
 * App: Contenedor con todos los Providers de contexto requeridos.
 */
export default function App() {
  return (
    <WebSocketProvider>
      <DmProvider>
        <DiceProvider>
          <CharacterProvider initialCharacterId={1}>
            <AppContent />
          </CharacterProvider>
        </DiceProvider>
      </DmProvider>
    </WebSocketProvider>
  );
}

// =============================================================================
// Estilos de layout
// =============================================================================
const styles = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#0d0905',
    color: '#e8dcc8',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    display: 'flex',
    flexDirection: 'column',
  },

  // Header
  appHeader: {
    padding: '12px 28px',
    borderBottom: '2px solid #4a3728',
    background: 'linear-gradient(180deg, #1a0c05 0%, #0d0905 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '14px',
  },
  logo: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#d4af37',
    letterSpacing: '2px',
    textShadow: '0 0 20px rgba(212,175,55,0.35)',
  },
  subtitle: {
    margin: 0,
    color: '#7a6a5a',
    fontSize: '0.8rem',
  },

  // Switcher de Vista
  viewSwitcher: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#140c06',
    padding: '4px',
    borderRadius: '6px',
    border: '1px solid #3a2a1a',
    flexWrap: 'wrap',
  },
  tabBtn: {
    backgroundColor: 'transparent',
    color: '#a0906a',
    border: 'none',
    padding: '7px 14px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    backgroundColor: '#2a1a0e',
    color: '#d4af37',
    border: '1px solid #d4af37',
    padding: '7px 14px',
    borderRadius: '4px',
    cursor: 'default',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  tabBtnDmActive: {
    backgroundColor: '#8b1a1a',
    color: '#f5e6d3',
    border: '1px solid #d4af37',
    padding: '7px 14px',
    borderRadius: '4px',
    cursor: 'default',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    boxShadow: '0 0 10px rgba(139, 26, 26, 0.4)',
  },
  lockBtn: {
    backgroundColor: '#1b0e06',
    color: '#e74c3c',
    border: '1px solid #8b1a1a',
    padding: '7px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    transition: 'all 0.15s ease',
  },

  playerMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },

  // Ficha personaje
  characterSection: {
    padding: '14px 28px',
    borderBottom: '1px solid #2a1e12',
  },

  // Área de juego del Jugador: 3 columnas (Proporciones ajustadas Sprint 14)
  gameArea: {
    display: 'grid',
    gridTemplateColumns: '260px minmax(320px, 380px) minmax(420px, 1fr)',
    gap: '20px',
    padding: '16px 28px',
    alignItems: 'start',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: 0,
  },
  centerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: 0,
    maxWidth: '400px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'sticky',
    top: '16px',
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
    minWidth: '380px',
  },


  // Bóveda de cartas
  cardSection: {
    padding: '0 28px 16px',
    borderTop: '1px solid #2a1e12',
    paddingTop: '16px',
  },

  // Contenedor principal del DJ
  dmMain: {
    flex: 1,
  },

  // Footer
  footer: {
    textAlign: 'center',
    padding: '10px',
    borderTop: '1px solid #2a1e12',
    color: '#4a3728',
    fontSize: '0.72rem',
  },
};
