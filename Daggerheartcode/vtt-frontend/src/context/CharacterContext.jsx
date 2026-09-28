import React, { createContext, useContext, useEffect, useState } from 'react';

// =============================================================================
// Context
// =============================================================================

const CharacterContext = createContext(null);

/**
 * Hook de acceso al contexto del personaje activo.
 */
export function useCharacter() {
  const ctx = useContext(CharacterContext);
  if (!ctx) {
    throw new Error('useCharacter debe usarse dentro de <CharacterProvider>');
  }
  return ctx;
}

// =============================================================================
// Provider
// =============================================================================

/**
 * Gestiona la carga del personaje del jugador desde la API REST.
 *
 * Expone:
 *   - character: El objeto PlayerCharacter completo (null mientras carga)
 *   - loading:   true mientras la petición está en curso
 *   - error:     mensaje de error si la carga falló
 *
 * En sprints futuros este provider también manejará la actualización
 * de stats (HP, Estrés, Esperanza) enviando los cambios al backend.
 *
 * @param {number} characterId - ID del personaje a cargar (default: 1)
 */
export function CharacterProvider({ children, characterId = 1 }) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`http://localhost:8080/api/characters/${characterId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Personaje no encontrado (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        setCharacter(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[VTT] Error cargando personaje:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [characterId]);

  const contextValue = {
    character,
    loading,
    error,
  };

  return (
    <CharacterContext.Provider value={contextValue}>
      {children}
    </CharacterContext.Provider>
  );
}
