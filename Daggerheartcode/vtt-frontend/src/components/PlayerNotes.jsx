import React, { useState, useEffect, useRef } from 'react';
import { useCharacter } from '../context/CharacterContext';

/**
 * PlayerNotes: Bloc de notas persistente para el jugador (Sprint 22).
 * Sincronizado automáticamente con el backend vía PATCH /api/characters/{id}/notes
 * con un debounce de 1 segundo (1000ms).
 */
export default function PlayerNotes() {
  const { character, setCharacter } = useCharacter();

  const [notes, setNotes] = useState(character?.notas || '');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'
  const debounceTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  // Sincronizar notas si el personaje cambia o se actualiza externamente
  useEffect(() => {
    if (!isTypingRef.current && character) {
      setNotes(character.notas || '');
    }
  }, [character?.id, character?.notas]);

  // Manejador de cambio con auto-guardado debounced (1s)
  const handleChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    setSaveStatus('saving');
    isTypingRef.current = true;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!character?.id) {
        setSaveStatus('saved');
        isTypingRef.current = false;
        return;
      }

      try {
        const res = await fetch(`/api/characters/${character.id}/notes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notas: val }),
        });

        if (res.ok) {
          const updated = await res.json();
          setSaveStatus('saved');
          isTypingRef.current = false;
          if (setCharacter) {
            setCharacter((prev) => (prev ? { ...prev, notas: updated.notas } : prev));
          }
        } else {
          console.warn('[PlayerNotes] Error al guardar notas:', res.statusText);
          setSaveStatus('saved');
          isTypingRef.current = false;
        }
      } catch (err) {
        console.error('[PlayerNotes] Error en conexión al guardar notas:', err);
        setSaveStatus('saved');
        isTypingRef.current = false;
      }
    }, 1000);
  };

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (!character) return null;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <span style={styles.icon}>📜</span>
          <span style={styles.title}>NOTAS DEL AVENTURERO</span>
        </div>
        <span
          style={saveStatus === 'saved' ? styles.statusSaved : styles.statusSaving}
        >
          {saveStatus === 'saved' ? '✓ Guardado' : '⏳ Guardando...'}
        </span>
      </div>

      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Apuntes de combate, bendiciones temporales, pistas o modificadores circunstanciales..."
        style={styles.textarea}
      />
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#1a1208',
    border: '1px solid #4a3728',
    borderRadius: '8px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    boxSizing: 'border-box',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #2e1f13',
    paddingBottom: '6px',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  icon: {
    fontSize: '0.95rem',
  },
  title: {
    color: '#d4af37',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  statusSaved: {
    color: '#7cd37c',
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
  statusSaving: {
    color: '#d4af37',
    fontSize: '0.7rem',
    fontStyle: 'italic',
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
    backgroundColor: '#0d0905',
    border: '1px solid #3a2a1a',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#e8dcc8',
    fontSize: '0.82rem',
    fontFamily: 'inherit',
    lineHeight: '1.45',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
  },
};
