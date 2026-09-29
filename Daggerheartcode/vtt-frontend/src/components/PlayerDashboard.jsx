import React, { useEffect, useState } from 'react';
import { useCharacter } from '../context/CharacterContext';

/**
 * PlayerDashboard: El Lobby del Jugador.
 *
 * Muestra la lista de héroes existentes y permite seleccionar uno para jugar
 * o iniciar el proceso de creación de un nuevo personaje.
 *
 * @param {Function} onSelectHero - Callback para ir a la vista de juego tras seleccionar un héroe.
 * @param {Function} onCreateHero - Callback para ir al CharacterCreator wizard.
 */
export default function PlayerDashboard({ onSelectHero, onCreateHero }) {
  const { selectCharacter, character: currentCharacter } = useCharacter();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/characters')
      .then((res) => {

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setCharacters(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Dashboard] Error cargando personajes:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function handlePlay(char) {
    selectCharacter(char);
    if (onSelectHero) onSelectHero();
  }

  return (
    <div style={styles.container}>
      {/* Banner Superior con botón gigante de forjar héroe */}
      <div style={styles.heroBanner}>
        <div style={styles.bannerInfo}>
          <h2 style={styles.bannerTitle}>Salón de los Héroes</h2>
          <p style={styles.bannerSubtitle}>
            Selecciona tu personaje para unirte a la mesa o forja un nuevo aventurero desde cero.
          </p>
        </div>
        <button onClick={onCreateHero} style={styles.btnCreateHero}>
          <span style={styles.createIcon}>✨</span>
          <span style={styles.createText}>FORJAR NUEVO HÉROE</span>
        </button>
      </div>

      {/* Grid de Personajes Existentes */}
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Tus Personajes Disponibles</h3>
        <span style={styles.counterBadge}>{characters.length} registrado(s)</span>
      </div>

      {loading && <p style={styles.statusText}>⏳ Buscando personajes en la crónica...</p>}
      {error && <p style={styles.errorText}>⚠️ Error al cargar personajes: {error}</p>}

      {!loading && characters.length === 0 && (
        <div style={styles.emptyCard}>
          <p style={styles.emptyText}>
            Aún no has forjado ningún héroe. ¡Pulsa el botón superior para crear tu primer personaje!
          </p>
        </div>
      )}

      <div style={styles.grid}>
        {characters.map((c) => {
          const isCurrent = currentCharacter?.id === c.id;

          return (
            <div
              key={c.id}
              style={{
                ...styles.charCard,
                borderColor: isCurrent ? '#d4af37' : '#4a3728',
                boxShadow: isCurrent ? '0 0 14px rgba(212, 175, 55, 0.25)' : 'none',
              }}
            >
              <div style={styles.cardHeader}>
                <div>
                  <h4 style={styles.charName}>{c.nombre}</h4>
                  <div style={styles.charIdentity}>
                    Nv. {c.nivel} · {c.clase}
                    {c.subclase && ` (${c.subclase})`}
                  </div>
                </div>
                <span style={styles.levelBadge}>Nv. {c.nivel}</span>
              </div>

              {/* Herencia y Comunidad */}
              <div style={styles.heritageRow}>
                <span style={styles.heritageChip}>Linaje: {c.ancestro || 'Desconocido'}</span>
                <span style={styles.heritageChip}>Comunidad: {c.comunidad || 'Desconocida'}</span>
              </div>

              {/* Stats clave */}
              <div style={styles.statsSummary}>
                <div style={styles.statMini}>
                  <span style={styles.statLabel}>HP</span>
                  <span style={styles.statVal}>{c.hpActual}/{c.hpMax}</span>
                </div>
                <div style={styles.statMini}>
                  <span style={styles.statLabel}>Estrés</span>
                  <span style={styles.statVal}>{c.estresActual}/{c.estresMax}</span>
                </div>
                <div style={styles.statMini}>
                  <span style={styles.statLabel}>Esperanza</span>
                  <span style={styles.statVal}>{c.esperanzaActual}/{c.esperanzaMax}</span>
                </div>
                <div style={styles.statMini}>
                  <span style={styles.statLabel}>Evasión</span>
                  <span style={styles.statVal}>{c.evasion}</span>
                </div>
              </div>

              {/* Botón de Jugar */}
              <button
                onClick={() => handlePlay(c)}
                style={styles.btnPlay}
              >
                ⚔️ Jugar con {c.nombre}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Estilos
// =============================================================================
const styles = {
  container: {
    padding: '24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  heroBanner: {
    backgroundColor: '#1c1108',
    border: '2px solid #8b1a1a',
    borderRadius: '10px',
    padding: '24px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
  bannerInfo: {
    flex: 1,
    minWidth: '280px',
  },
  bannerTitle: {
    margin: '0 0 6px 0',
    color: '#d4af37',
    fontSize: '1.6rem',
    letterSpacing: '1px',
    textShadow: '0 0 15px rgba(212, 175, 55, 0.3)',
  },
  bannerSubtitle: {
    margin: 0,
    color: '#a0906a',
    fontSize: '0.9rem',
    lineHeight: '1.4',
  },
  btnCreateHero: {
    backgroundColor: '#8b1a1a',
    border: '2px solid #d4af37',
    borderRadius: '8px',
    padding: '16px 24px',
    color: '#f5e6d3',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 14px rgba(139, 26, 26, 0.4)',
  },
  createIcon: {
    fontSize: '1.4rem',
  },
  createText: {
    fontSize: '1.05rem',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #3a2a1a',
    paddingBottom: '10px',
  },
  sectionTitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1.2rem',
  },
  counterBadge: {
    backgroundColor: '#241a0e',
    color: '#a0906a',
    border: '1px solid #4a3728',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '0.8rem',
  },
  statusText: {
    color: '#7a6a5a',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '30px 0',
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
  },
  emptyCard: {
    padding: '36px',
    textAlign: 'center',
    backgroundColor: '#160e06',
    border: '1px dashed #4a3728',
    borderRadius: '8px',
  },
  emptyText: {
    color: '#a0906a',
    fontStyle: 'italic',
    fontSize: '0.95rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  charCard: {
    backgroundColor: '#181008',
    border: '1px solid #4a3728',
    borderRadius: '8px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'transform 0.15s ease, border-color 0.15s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  charName: {
    margin: '0 0 4px 0',
    color: '#d4af37',
    fontSize: '1.15rem',
  },
  charIdentity: {
    color: '#a0906a',
    fontSize: '0.82rem',
  },
  levelBadge: {
    backgroundColor: '#8b1a1a',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  heritageRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderTop: '1px solid #2a1e12',
    borderBottom: '1px solid #2a1e12',
    padding: '8px 0',
  },
  heritageChip: {
    color: '#b0a08a',
    fontSize: '0.78rem',
  },
  statsSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '6px',
    backgroundColor: '#0d0905',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #2a1e12',
  },
  statMini: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  statLabel: {
    color: '#7a6a5a',
    fontSize: '0.65rem',
    textTransform: 'uppercase',
  },
  statVal: {
    color: '#e8dcc8',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  btnPlay: {
    marginTop: '6px',
    backgroundColor: '#8b1a1a',
    color: '#f5e6d3',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.5px',
    transition: 'background-color 0.15s ease',
  },
};
