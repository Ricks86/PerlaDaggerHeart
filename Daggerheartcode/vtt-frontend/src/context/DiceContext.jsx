import React, { createContext, useContext, useState } from 'react';

// =============================================================================
// Context
// =============================================================================

const DiceContext = createContext(null);

/**
 * Hook de acceso al contexto del motor de dados.
 */
export function useDice() {
  const ctx = useContext(DiceContext);
  if (!ctx) throw new Error('useDice debe usarse dentro de <DiceProvider>');
  return ctx;
}

// =============================================================================
// Provider
// =============================================================================

/**
 * DiceContext permite comunicación entre CharacterHeader y DiceRoller
 * sin prop drilling.
 *
 * Flujo de la feature de atributo clickable:
 *   1. Jugador hace clic en "Agilidad +2" en CharacterHeader
 *   2. CharacterHeader llama requestDualityWithMod(2, 'Agilidad')
 *   3. DiceRoller detecta el pendingModifier via useEffect
 *   4. DiceRoller cambia a pestaña DUALITY y aplica el modificador
 *   5. clearPendingModifier() limpia el estado
 */
export function DiceProvider({ children }) {
  /**
   * { value: number, label: string, ts: number } | null
   * ts (timestamp) garantiza que un mismo modificador repetido siga
   * disparando el useEffect en DiceRoller.
   */
  const [pendingModifier, setPendingModifier] = useState(null);

  function requestDualityWithMod(value, label) {
    setPendingModifier({ value, label, ts: Date.now() });
  }

  function clearPendingModifier() {
    setPendingModifier(null);
  }

  return (
    <DiceContext.Provider value={{ pendingModifier, requestDualityWithMod, clearPendingModifier }}>
      {children}
    </DiceContext.Provider>
  );
}
