import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CompendiumContext = createContext(null);

/**
 * useCompendium — Hook general para acceder a los catálogos en caché y sus refrescos.
 */
export function useCompendium() {
  const ctx = useContext(CompendiumContext);
  if (!ctx) {
    throw new Error('useCompendium debe usarse dentro de <CompendiumProvider>');
  }
  return ctx;
}

/**
 * useCards — Hook de conveniencia para consumir el catálogo de cartas en caché.
 */
export function useCards() {
  const { cards, loadingCards, cardsError, refreshCards } = useCompendium();
  return {
    cards,
    loading: loadingCards,
    error: cardsError,
    refresh: refreshCards,
  };
}

/**
 * useItems — Hook de conveniencia para consumir el catálogo de objetos en caché.
 */
export function useItems() {
  const { items, loadingItems, itemsError, refreshItems } = useCompendium();
  return {
    items,
    loading: loadingItems,
    error: itemsError,
    refresh: refreshItems,
  };
}

/**
 * CompendiumProvider — Almacena en memoria caché los catálogos globales de cartas e ítems
 * evitando múltiples llamadas HTTP redundantes cada vez que se abren modales o paneles.
 */
export function CompendiumProvider({ children }) {
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [cardsError, setCardsError] = useState(null);

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState(null);

  // Carga o refresco de cartas (/api/cards)
  const refreshCards = useCallback(async () => {
    setLoadingCards(true);
    setCardsError(null);
    try {
      const res = await fetch('/api/cards');
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setCards(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[CompendiumContext] Error cargando cartas:', err);
      setCardsError(err.message);
    } finally {
      setLoadingCards(false);
    }
  }, []);

  // Carga o refresco de objetos (/api/items)
  const refreshItems = useCallback(async () => {
    setLoadingItems(true);
    setItemsError(null);
    try {
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[CompendiumContext] Error cargando ítems:', err);
      setItemsError(err.message);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  // Carga inicial al arrancar la app
  useEffect(() => {
    refreshCards();
    refreshItems();
  }, [refreshCards, refreshItems]);

  const value = {
    cards,
    loadingCards,
    cardsError,
    refreshCards,

    items,
    loadingItems,
    itemsError,
    refreshItems,
  };

  return (
    <CompendiumContext.Provider value={value}>
      {children}
    </CompendiumContext.Provider>
  );
}
