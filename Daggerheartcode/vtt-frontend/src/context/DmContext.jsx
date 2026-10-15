import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './WebSocketContext';

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
// Helper: Normalizar instancia activa para compatibilidad total
// =============================================================================
function normalizeAdversary(adv) {
  if (!adv) return null;
  return {
    ...adv,
    instanceId: adv.id,
    nombre: adv.nombreInstancia || adv.nombre || 'Adversario',
    hpMax: adv.hpMaximo ?? adv.hpMax ?? 4,
    hpActual: adv.hpActual ?? adv.hpMaximo ?? 4,
    estresMax: adv.estresMaximo ?? adv.estresMax ?? 3,
    estresActual: adv.estresActual ?? 0,
    modificadorAtaque: adv.modAtaque ?? adv.modificadorAtaque ?? 0,
    danoEstandar: adv.danoEstandar || '1d8+2',
  };
}

// =============================================================================
// Provider
// =============================================================================

export function DmProvider({ children }) {
  const { tableLog } = useWebSocket();

  // Escena activa de combate (ActiveAdversary de la BD)
  const [activeEncounter, setActiveEncounter] = useState([]);
  // Monstruo actualmente enfocado / seleccionado para el DmRoller
  const [selectedAdversary, setSelectedAdversary] = useState(null);
  // Compendio / Bestiario persistente en PostgreSQL (AdversaryTemplate)
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Cargas iniciales desde la API REST
  // ---------------------------------------------------------------------------
  const fetchActiveEncounter = useCallback(async () => {
    try {
      const res = await fetch('/api/encounters/active');
      if (res.ok) {
        const data = await res.json();
        const normalized = data.map(normalizeAdversary);
        setActiveEncounter(normalized);
        setSelectedAdversary((prev) => {
          if (!prev) return normalized.length > 0 ? normalized[0] : null;
          const found = normalized.find((a) => a.id === prev.id);
          return found || (normalized.length > 0 ? normalized[0] : null);
        });
      }
    } catch (err) {
      console.warn('[DmContext] Error al cargar adversarios activos:', err);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/encounters/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.warn('[DmContext] Error al cargar compendio de adversarios:', err);
    }
  }, []);

  useEffect(() => {
    fetchActiveEncounter();
    fetchTemplates();
  }, [fetchActiveEncounter, fetchTemplates]);

  // ---------------------------------------------------------------------------
  // Sincronización en tiempo real vía WebSocket (/topic/table)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!tableLog || tableLog.length === 0) return;
    const lastAction = tableLog[tableLog.length - 1];

    if (lastAction.type === 'ENCOUNTER_UPDATE' && Array.isArray(lastAction.payload)) {
      const normalized = lastAction.payload.map(normalizeAdversary);
      setActiveEncounter(normalized);
      setSelectedAdversary((prev) => {
        if (!prev) return normalized.length > 0 ? normalized[0] : null;
        const found = normalized.find((a) => a.id === prev.id);
        return found || (normalized.length > 0 ? normalized[0] : null);
      });
    }
  }, [tableLog]);

  // ---------------------------------------------------------------------------
  // Acciones sobre la Escena de Combate (ActiveAdversary)
  // ---------------------------------------------------------------------------

  /**
   * Invoca N instancias de un monstruo (desde plantilla o datos personalizados)
   */
  async function spawnAdversaries(request) {
    setLoading(true);
    try {
      const res = await fetch('/api/encounters/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      await fetchActiveEncounter();
    } finally {
      setLoading(false);
    }
  }

  /**
   * Helper compatible para añadir adversario (soporta plantilla o datos de formulario)
   */
  async function addAdversary(data, cantidad = 1) {
    const payload = {
      templateId: data.templateId || data.id,
      cantidad: cantidad || 1,
      nombre: data.nombre,
      tier: data.tier,
      rango: data.rango,
      dificultad: data.dificultad,
      hpMaximo: data.hpMaximo ?? data.hpMax ?? data.hp,
      estresMaximo: data.estresMaximo ?? data.estresMax ?? data.estres,
      umbralMayor: data.umbralMayor,
      umbralGrave: data.umbralGrave,
      modAtaque: data.modAtaque ?? data.modificadorAtaque,
      danoEstandar: data.danoEstandar,
      rasgosEspeciales: data.rasgosEspeciales,
    };
    return spawnAdversaries(payload);
  }

  /**
   * Actualiza el HP actual de un monstruo activo en escena
   */
  async function updateAdversaryHp(id, newHp) {
    // Actualización optimista local
    setActiveEncounter((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const clamped = Math.max(0, Math.min(a.hpMaximo ?? a.hpMax, newHp));
          const updated = { ...a, hpActual: clamped };
          if (selectedAdversary?.id === id) setSelectedAdversary(updated);
          return updated;
        }
        return a;
      })
    );

    try {
      const res = await fetch(`/api/encounters/active/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hpActual: newHp }),
      });
      if (res.ok) {
        const updated = await res.json();
        const norm = normalizeAdversary(updated);
        setActiveEncounter((prev) => prev.map((a) => (a.id === id ? norm : a)));
        if (selectedAdversary?.id === id) setSelectedAdversary(norm);
      }
    } catch (err) {
      console.error('[DmContext] Error al actualizar HP:', err);
    }
  }

  /**
   * Actualiza el Estrés actual de un monstruo activo en escena
   */
  async function updateAdversaryStress(id, newStress) {
    // Actualización optimista local
    setActiveEncounter((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const clamped = Math.max(0, Math.min(a.estresMaximo ?? a.estresMax, newStress));
          const updated = { ...a, estresActual: clamped };
          if (selectedAdversary?.id === id) setSelectedAdversary(updated);
          return updated;
        }
        return a;
      })
    );

    try {
      const res = await fetch(`/api/encounters/active/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estresActual: newStress }),
      });
      if (res.ok) {
        const updated = await res.json();
        const norm = normalizeAdversary(updated);
        setActiveEncounter((prev) => prev.map((a) => (a.id === id ? norm : a)));
        if (selectedAdversary?.id === id) setSelectedAdversary(norm);
      }
    } catch (err) {
      console.error('[DmContext] Error al actualizar Estrés:', err);
    }
  }

  /**
   * Elimina un adversario individual del encuentro activo
   */
  async function removeAdversary(id) {
    setActiveEncounter((prev) => prev.filter((a) => a.id !== id));
    if (selectedAdversary?.id === id) {
      const remaining = activeEncounter.filter((a) => a.id !== id);
      setSelectedAdversary(remaining.length > 0 ? remaining[0] : null);
    }

    try {
      await fetch(`/api/encounters/active/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('[DmContext] Error al eliminar adversario activo:', err);
    }
  }

  /**
   * Limpia toda la escena de combate (todos los monstruos activos)
   */
  async function clearEncounter() {
    setActiveEncounter([]);
    setSelectedAdversary(null);
    try {
      await fetch('/api/encounters/clear', { method: 'DELETE' });
    } catch (err) {
      console.error('[DmContext] Error al limpiar escena:', err);
    }
  }

  /**
   * Cambia el adversario seleccionado para tiradas en DmRoller
   */
  function selectAdversary(adversary) {
    setSelectedAdversary(normalizeAdversary(adversary));
  }

  // ---------------------------------------------------------------------------
  // Compendio de Plantillas (AdversaryTemplate)
  // ---------------------------------------------------------------------------

  /**
   * Guarda o actualiza un molde en el compendio
   */
  async function saveTemplate(templateData) {
    const res = await fetch('/api/encounters/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const saved = await res.json();
    await fetchTemplates();
    return saved;
  }

  /**
   * Elimina una plantilla del compendio
   */
  async function deleteTemplate(id) {
    const res = await fetch(`/api/encounters/templates/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    await fetchTemplates();
  }

  const value = {
    activeEncounter,
    selectedAdversary,
    templates,
    dbPresets: templates, // Alias retrocompatible
    loading,
    fetchActiveEncounter,
    fetchTemplates,
    spawnAdversaries,
    addAdversary,
    removeAdversary,
    clearEncounter,
    selectAdversary,
    updateAdversaryHp,
    updateAdversaryStress,
    saveTemplate,
    deleteTemplate,
  };

  return <DmContext.Provider value={value}>{children}</DmContext.Provider>;
}
