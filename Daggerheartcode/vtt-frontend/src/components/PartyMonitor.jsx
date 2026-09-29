import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import MiniCharacterSheet from './MiniCharacterSheet';

const STORAGE_KEY = 'daggerheart_dm_monitored_party_ids';
const MAX_MONITORED = 5;

/**
 * PartyMonitor: Panel del Dungeon Master para monitorear en tiempo real
 * los recursos vitales, armadura y umbrales de hasta 5 héroes (Sprint 13).
 */
export default function PartyMonitor() {
  const { tableLog, connected } = useWebSocket();

  // IDs de personajes anclados, sincronizados con localStorage
  const [selectedIds, setSelectedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [allCharacters, setAllCharacters] = useState([]);
  const [selectedToPin, setSelectedToPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const prevLogLengthRef = useRef(tableLog.length);

  // Guardar en localStorage ante cualquier cambio en selectedIds
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch (err) {
      console.warn('[PartyMonitor] Error guardando en localStorage:', err);
    }
  }, [selectedIds]);

  // Carga o recarga de la lista de todos los personajes
  const fetchCharacters = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);

    try {
      const res = await fetch('/api/characters');
      if (res.ok) {
        const data = await res.json();
        setAllCharacters(data);
        setLastSync(new Date().toLocaleTimeString('es-ES'));
      }
    } catch (err) {
      console.error('[PartyMonitor] Error cargando personajes:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // 1. Carga inicial al montar
  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // 2. Sincronización en tiempo real vía WebSocket (Fase 3)
  useEffect(() => {
    // Si llegó un nuevo mensaje en el log compartido de la mesa
    if (tableLog.length > prevLogLengthRef.current) {
      prevLogLengthRef.current = tableLog.length;
      // Re-fetch silencioso para actualizar inmediatamente los datos del monitor
      fetchCharacters(true);
    }
  }, [tableLog, fetchCharacters]);

  // 3. Polling ligero de respaldo cada 5 segundos mientras esta pestaña esté activa (Fase 3)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchCharacters(true);
    }, 5000);

    return () => clearInterval(timer);
  }, [fetchCharacters]);

  // Anclar un héroe al monitor (máximo 5)
  const handlePin = () => {
    if (!selectedToPin) return;
    const idNum = parseInt(selectedToPin, 10);
    if (!selectedIds.includes(idNum) && selectedIds.length < MAX_MONITORED) {
      setSelectedIds((prev) => [...prev, idNum]);
      setSelectedToPin('');
    }
  };

  // Desanclar un héroe
  const handleUnpin = (idToRemove) => {
    setSelectedIds((prev) => prev.filter((id) => id !== idToRemove));
  };

  // Filtrar los objetos de los personajes anclados
  const monitoredCharacters = selectedIds
    .map((id) => allCharacters.find((c) => c.id === id))
    .filter(Boolean);

  // Personajes disponibles que aún no han sido anclados
  const unpinnedCharacters = allCharacters.filter((c) => !selectedIds.includes(c.id));

  return (
    <div style={styles.container}>
      {/* ------------------------------------------------------------- */}
      {/* BARRA SUPERIOR: Título, Selector Dinámico y Estado En Vivo    */}
      {/* ------------------------------------------------------------- */}
      <div style={styles.topBar}>
        <div style={styles.titleBlock}>
          <div style={styles.titleRow}>
            <h3 style={styles.mainTitle}>👥 Monitor de Grupo</h3>
            <span style={connected ? styles.liveBadge : styles.liveBadgeOffline}>
              {connected ? '🟢 En Vivo (WS + Polling 5s)' : '🟡 Conectando WS (Polling Activo)'}
            </span>
            {lastSync && <span style={styles.lastSyncText}>Sinc: {lastSync}</span>}
          </div>
          <p style={styles.subtitle}>
            Seguimiento de HP, Estrés, Esperanza, Evasión y Umbrales en tiempo real para el DJ.
          </p>
        </div>

        {/* Selector dinámico de héroes */}
        <div style={styles.pickerControls}>
          <select
            value={selectedToPin}
            onChange={(e) => setSelectedToPin(e.target.value)}
            disabled={selectedIds.length >= MAX_MONITORED || unpinnedCharacters.length === 0}
            style={
              selectedIds.length >= MAX_MONITORED || unpinnedCharacters.length === 0
                ? styles.selectDisabled
                : styles.select
            }
          >
            <option value="">
              {selectedIds.length >= MAX_MONITORED
                ? '— Máximo 5 héroes anclados —'
                : unpinnedCharacters.length === 0
                ? '— Todos los héroes anclados —'
                : '-- Selecciona un héroe para anclar --'}
            </option>
            {unpinnedCharacters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} (Nv.{c.nivel} {c.clase})
              </option>
            ))}
          </select>

          <button
            onClick={handlePin}
            disabled={!selectedToPin || selectedIds.length >= MAX_MONITORED}
            style={
              !selectedToPin || selectedIds.length >= MAX_MONITORED
                ? styles.btnPinDisabled
                : styles.btnPin
            }
          >
            + Anclar ({selectedIds.length}/{MAX_MONITORED})
          </button>

          <button
            onClick={() => fetchCharacters(false)}
            style={styles.btnRefresh}
            title="Forzar actualización manual ahora"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CUADRÍCULA DE HÉROES MONITOREADOS (Mini-Hojas)                */}
      {/* ------------------------------------------------------------- */}
      {loading && monitoredCharacters.length === 0 ? (
        <div style={styles.emptyContainer}>
          <p style={styles.emptyText}>⏳ Cargando datos del grupo...</p>
        </div>
      ) : monitoredCharacters.length === 0 ? (
        <div style={styles.emptyContainer}>
          <span style={styles.emptyIcon}>🛡️</span>
          <h4 style={styles.emptyTitle}>No hay héroes en el monitor</h4>
          <p style={styles.emptyDesc}>
            Selecciona hasta 5 personajes en la barra superior para fijar sus mini-hojas y seguir sus
            recursos durante el combate.
          </p>
          {allCharacters.length > 0 && selectedIds.length === 0 && (
            <button
              onClick={() => {
                const autoIds = allCharacters.slice(0, MAX_MONITORED).map((c) => c.id);
                setSelectedIds(autoIds);
              }}
              style={styles.btnAutoPin}
            >
              👥 Anclar primeros {Math.min(allCharacters.length, MAX_MONITORED)} héroes
            </button>
          )}
        </div>
      ) : (
        <div style={styles.partyGrid}>
          {monitoredCharacters.map((hero) => (
            <MiniCharacterSheet
              key={hero.id}
              character={hero}
              onRemove={handleUnpin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  topBar: {
    backgroundColor: '#150f07',
    border: '1px solid #4a3728',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  mainTitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1.25rem',
    letterSpacing: '0.5px',
  },
  liveBadge: {
    backgroundColor: '#142b14',
    color: '#7cd37c',
    border: '1px solid #2d6b2d',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
  },
  liveBadgeOffline: {
    backgroundColor: '#2b2314',
    color: '#d4af37',
    border: '1px solid #6b572d',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '0.72rem',
  },
  lastSyncText: {
    color: '#7a6a5a',
    fontSize: '0.7rem',
  },
  subtitle: {
    margin: 0,
    color: '#7a6a5a',
    fontSize: '0.8rem',
  },
  pickerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  select: {
    backgroundColor: '#0a0704',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    color: '#e8dcc8',
    padding: '7px 10px',
    fontSize: '0.82rem',
    outline: 'none',
    minWidth: '220px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  selectDisabled: {
    backgroundColor: '#120b06',
    border: '1px solid #2e1f13',
    borderRadius: '4px',
    color: '#6a5a4a',
    padding: '7px 10px',
    fontSize: '0.82rem',
    minWidth: '220px',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
  btnPin: {
    backgroundColor: '#8b1a1a',
    color: '#f5e6c8',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    padding: '7px 12px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
  },
  btnPinDisabled: {
    backgroundColor: '#2e1919',
    color: '#6a4a4a',
    border: '1px solid #4a2828',
    borderRadius: '4px',
    padding: '7px 12px',
    fontSize: '0.8rem',
    cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
  btnRefresh: {
    backgroundColor: '#241a0e',
    color: '#d4af37',
    border: '1px solid #4a3728',
    borderRadius: '4px',
    padding: '7px 10px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Grid
  partyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '14px',
  },
  emptyContainer: {
    backgroundColor: '#150f07',
    border: '1px dashed #4a3728',
    borderRadius: '8px',
    padding: '36px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '2rem',
    opacity: 0.4,
  },
  emptyTitle: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1.1rem',
  },
  emptyDesc: {
    margin: 0,
    color: '#7a6a5a',
    fontSize: '0.82rem',
    maxWidth: '440px',
  },
  emptyText: {
    color: '#7a6a5a',
    fontStyle: 'italic',
    fontSize: '0.9rem',
  },
  btnAutoPin: {
    marginTop: '8px',
    backgroundColor: '#241a0e',
    color: '#d4af37',
    border: '1px solid #d4af37',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
