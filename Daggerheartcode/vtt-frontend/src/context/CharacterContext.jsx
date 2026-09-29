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
 * Gestiona el personaje activo del jugador, permitiendo cambiar de personaje,
 * crearlos y sincronizar actualizaciones con la API REST.
 */
export function CharacterProvider({ children, initialCharacterId = 1 }) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carga inicial o recarga por ID
  function loadCharacterById(id) {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetch(`/api/characters/${id}`)
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
  }

  useEffect(() => {
    loadCharacterById(initialCharacterId);
  }, [initialCharacterId]);

  /**
   * Cambia el personaje activo, ya sea pasando el objeto completo o su ID.
   */
  function selectCharacter(charOrId) {
    if (typeof charOrId === 'object' && charOrId !== null) {
      setCharacter(charOrId);
      setLoading(false);
      setError(null);
    } else {
      loadCharacterById(charOrId);
    }
  }

  /**
   * Actualiza el personaje tanto en el estado local como en la base de datos vía PUT.
   */
  function updateActiveCharacter(updatedData) {
    if (!character?.id) return Promise.resolve(null);

    const merged = { ...character, ...updatedData };
    setCharacter(merged);

    return fetch(`/api/characters/${character.id}`, {

      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    })
      .then((res) => (res.ok ? res.json() : merged))
      .then((saved) => {
        setCharacter(saved);
        return saved;
      })
      .catch((err) => {
        console.error('[VTT] Error actualizando personaje:', err);
        return merged;
      });
  }

  const contextValue = {
    character,
    setCharacter,
    selectCharacter,
    updateActiveCharacter,
    reloadCharacter: () => loadCharacterById(character?.id),
    loading,
    error,
  };

  return (
    <CharacterContext.Provider value={contextValue}>
      {children}
    </CharacterContext.Provider>
  );
}
