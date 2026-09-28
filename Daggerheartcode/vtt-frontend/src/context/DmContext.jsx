import React, { createContext, useContext, useState, useEffect } from 'react';

// =============================================================================
// Context
// =============================================================================

const DmContext = createContext(null);

export function useDm() {
  const ctx = useContext(DmContext);
  if (!ctx) {
    throw new Error('useDm debe usarse dentro de <DmProvider>');
  }
  return ctx;
}

// =============================================================================
// Provider
// =============================================================================

export function DmProvider({ children }) {
  // Lista de adversarios activos en el encuentro actual
  const [activeEncounter, setActiveEncounter] = useState([]);
  // Adversario seleccionado para tiradas y gestión
  const [selectedAdversary, setSelectedAdversary] = useState(null);
  // Presets cargados de la base de datos (/api/adversaries)
  const [dbPresets, setDbPresets] = useState([]);

  // Carga inicial de presets desde el backend
  useEffect(() => {
    fetch('http://localhost:8080/api/adversaries')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setDbPresets(data);
      })
      .catch((err) => {
        console.warn('[DmContext] No se pudieron cargar adversarios del backend:', err);
      });
  }, []);

  /**
   * Añade un monstruo al encuentro activo asegurando ID único y tracking de estado.
   */
  function addAdversary(adversaryData) {
    const hpMax = parseInt(adversaryData.hpMax ?? adversaryData.hp ?? 4, 10);
    const estresMax = parseInt(adversaryData.estresMax ?? adversaryData.estres ?? 3, 10);

    const instance = {
      instanceId: `adv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nombre: adversaryData.nombre || 'Adversario sin nombre',
      rango: adversaryData.rango || 'Estándar',
      dificultad: adversaryData.dificultad || 'Moderado',
      umbralMayor: parseInt(adversaryData.umbralMayor || 0, 10),
      umbralGrave: parseInt(adversaryData.umbralGrave || 0, 10),
      hpMax: hpMax,
      hpActual: hpMax, // Comienza con vida completa
      estresMax: estresMax,
      estresActual: 0, // Comienza sin estrés acumulado
      modificadorAtaque: parseInt(adversaryData.modificadorAtaque || 0, 10),
      danoEstandar: adversaryData.danoEstandar || '1d8',
    };

    setActiveEncounter((prev) => [...prev, instance]);

    // Si no hay ninguno seleccionado, seleccionar este automáticamente
    if (!selectedAdversary) {
      setSelectedAdversary(instance);
    }
  }

  /**
   * Elimina un adversario del encuentro.
   */
  function removeAdversary(instanceId) {
    setActiveEncounter((prev) => prev.filter((a) => a.instanceId !== instanceId));
    if (selectedAdversary?.instanceId === instanceId) {
      setSelectedAdversary(null);
    }
  }

  /**
   * Selecciona el adversario activo para el DmRoller.
   */
  function selectAdversary(adversary) {
    setSelectedAdversary(adversary);
  }

  /**
   * Actualiza el HP actual de un adversario específico.
   */
  function updateAdversaryHp(instanceId, newHp) {
    setActiveEncounter((prev) =>
      prev.map((adv) => {
        if (adv.instanceId === instanceId) {
          const clamped = Math.max(0, Math.min(adv.hpMax, newHp));
          const updated = { ...adv, hpActual: clamped };
          if (selectedAdversary?.instanceId === instanceId) {
            setSelectedAdversary(updated);
          }
          return updated;
        }
        return adv;
      })
    );
  }

  /**
   * Actualiza el Estrés actual de un adversario específico.
   */
  function updateAdversaryStress(instanceId, newStress) {
    setActiveEncounter((prev) =>
      prev.map((adv) => {
        if (adv.instanceId === instanceId) {
          const clamped = Math.max(0, Math.min(adv.estresMax, newStress));
          const updated = { ...adv, estresActual: clamped };
          if (selectedAdversary?.instanceId === instanceId) {
            setSelectedAdversary(updated);
          }
          return updated;
        }
        return adv;
      })
    );
  }

  const value = {
    activeEncounter,
    selectedAdversary,
    dbPresets,
    addAdversary,
    removeAdversary,
    selectAdversary,
    updateAdversaryHp,
    updateAdversaryStress,
  };

  return <DmContext.Provider value={value}>{children}</DmContext.Provider>;
}
