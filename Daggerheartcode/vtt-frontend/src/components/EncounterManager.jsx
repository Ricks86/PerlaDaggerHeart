import React, { useState, useMemo } from 'react';
import { useDm } from '../context/DmContext';
import TacticalGrid from './encounter/TacticalGrid';
import BestiaryCompendium from './encounter/BestiaryCompendium';
import CreateMonsterForm from './encounter/CreateMonsterForm';
import { encounterStyles as styles } from './encounter/encounterStyles';

/**
 * EncounterManager: Orquestador modularizado para el combate del DJ y gestión de adversarios.
 *
 * Secciones:
 *  - TacticalGrid: Grid táctico superior (5x3, máx 15 adversarios).
 *  - SubTabs:
 *    - BestiaryCompendium: Catálogo de moldes, filtros rápidos y adición a la escena.
 *    - CreateMonsterForm: Formulario de diseño con guardado e invocación.
 */
export default function EncounterManager() {
  const {
    activeEncounter,
    selectedAdversary,
    templates,
    loading,
    spawnAdversaries,
    removeAdversary,
    clearEncounter,
    selectAdversary,
    updateAdversaryHp,
    updateAdversaryStress,
    saveTemplate,
    deleteTemplate,
  } = useDm();

  // Sub-pestaña activa: 'COMPENDIUM' | 'CREATE'
  const [subTab, setSubTab] = useState('COMPENDIUM');

  // Filtros del Compendio
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedRango, setSelectedRango] = useState('ALL');

  // Cantidades de invocación seleccionadas por template ID: { [templateId]: number }
  const [spawnQuantities, setSpawnQuantities] = useState({});

  // Estado del Formulario "Crear Nuevo Monstruo"
  const [formData, setFormData] = useState({
    nombre: '',
    tier: 1,
    rango: 'Estándar',
    dificultad: 'Moderado',
    hpMaximo: 4,
    estresMaximo: 3,
    umbralMayor: 8,
    umbralGrave: 15,
    modAtaque: 2,
    danoEstandar: '1d8+2',
    rasgosEspeciales: '',
  });
  const [formSpawnQuantity, setFormSpawnQuantity] = useState(1);
  const [formFeedback, setFormFeedback] = useState(null);

  // Espacio restante en el grid táctico (máximo 15)
  const remainingSlots = Math.max(0, 15 - activeEncounter.length);

  // Filtrado de Monstruos del Compendio
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchName =
        !searchQuery.trim() ||
        tpl.nombre.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchTier = selectedTier === 'ALL' || tpl.tier === parseInt(selectedTier, 10);
      const matchRango = selectedRango === 'ALL' || tpl.rango === selectedRango;
      return matchName && matchTier && matchRango;
    });
  }, [templates, searchQuery, selectedTier, selectedRango]);

  // Manejo de Invocación desde el Compendio
  async function handleSpawnFromTemplate(template) {
    const qty = spawnQuantities[template.id] || 1;
    if (activeEncounter.length + qty > 15) {
      alert(`No puedes superar el límite de 15 monstruos simultáneos (disponibles: ${remainingSlots}).`);
      return;
    }
    try {
      await spawnAdversaries({
        templateId: template.id,
        cantidad: qty,
      });
    } catch (err) {
      alert(`Error al invocar: ${err.message}`);
    }
  }

  function handleQuantityChange(templateId, qty) {
    setSpawnQuantities((prev) => ({
      ...prev,
      [templateId]: parseInt(qty, 10),
    }));
  }

  // Manejo de Creación y Guardado de Nuevo Monstruo
  function handleFormChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveOnlyTemplate(e) {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    try {
      await saveTemplate({
        ...formData,
        tier: parseInt(formData.tier, 10),
        hpMaximo: parseInt(formData.hpMaximo, 10),
        estresMaximo: parseInt(formData.estresMaximo, 10),
        umbralMayor: parseInt(formData.umbralMayor, 10),
        umbralGrave: parseInt(formData.umbralGrave, 10),
        modAtaque: parseInt(formData.modAtaque, 10),
      });
      setFormFeedback({ type: 'success', text: `✓ "${formData.nombre}" guardado en el Bestiario.` });
      setFormData((prev) => ({ ...prev, nombre: '', rasgosEspeciales: '' }));
      setTimeout(() => setFormFeedback(null), 3000);
    } catch (err) {
      setFormFeedback({ type: 'error', text: `Error: ${err.message}` });
    }
  }

  async function handleSaveAndSpawn(e) {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    const qty = formSpawnQuantity;
    if (activeEncounter.length + qty > 15) {
      alert(`No puedes superar el límite de 15 monstruos simultáneos (disponibles: ${remainingSlots}).`);
      return;
    }

    try {
      const saved = await saveTemplate({
        ...formData,
        tier: parseInt(formData.tier, 10),
        hpMaximo: parseInt(formData.hpMaximo, 10),
        estresMaximo: parseInt(formData.estresMaximo, 10),
        umbralMayor: parseInt(formData.umbralMayor, 10),
        umbralGrave: parseInt(formData.umbralGrave, 10),
        modAtaque: parseInt(formData.modAtaque, 10),
      });

      await spawnAdversaries({
        templateId: saved.id,
        cantidad: qty,
      });

      setFormFeedback({
        type: 'success',
        text: `✓ "${formData.nombre}" guardado e invocado (x${qty}) en el grid táctico.`,
      });
      setFormData((prev) => ({ ...prev, nombre: '', rasgosEspeciales: '' }));
      setTimeout(() => setFormFeedback(null), 3000);
    } catch (err) {
      setFormFeedback({ type: 'error', text: `Error: ${err.message}` });
    }
  }

  async function handleDirectSpawnWithoutSaving(e) {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    const qty = formSpawnQuantity;
    if (activeEncounter.length + qty > 15) {
      alert(`No puedes superar el límite de 15 monstruos simultáneos (disponibles: ${remainingSlots}).`);
      return;
    }

    try {
      await spawnAdversaries({
        nombre: formData.nombre,
        tier: parseInt(formData.tier, 10),
        rango: formData.rango,
        dificultad: formData.dificultad,
        hpMaximo: parseInt(formData.hpMaximo, 10),
        estresMaximo: parseInt(formData.estresMaximo, 10),
        umbralMayor: parseInt(formData.umbralMayor, 10),
        umbralGrave: parseInt(formData.umbralGrave, 10),
        modAtaque: parseInt(formData.modAtaque, 10),
        danoEstandar: formData.danoEstandar,
        rasgosEspeciales: formData.rasgosEspeciales,
        cantidad: qty,
      });

      setFormFeedback({
        type: 'success',
        text: `✓ Monstruo efímero "${formData.nombre}" invocado (x${qty}).`,
      });
      setFormData((prev) => ({ ...prev, nombre: '', rasgosEspeciales: '' }));
      setTimeout(() => setFormFeedback(null), 3000);
    } catch (err) {
      setFormFeedback({ type: 'error', text: `Error: ${err.message}` });
    }
  }

  function handleClearScene() {
    if (activeEncounter.length === 0) return;
    if (window.confirm('¿Seguro que deseas eliminar todos los adversarios activos de la escena?')) {
      clearEncounter();
    }
  }

  function handleDeleteTemplate(template) {
    if (window.confirm(`¿Seguro que deseas eliminar permanentemente a "${template.nombre}" del compendio?`)) {
      deleteTemplate(template.id);
    }
  }

  return (
    <div style={styles.container}>
      {/* SECCIÓN SUPERIOR: Grid Táctico */}
      <TacticalGrid
        activeEncounter={activeEncounter}
        selectedAdversary={selectedAdversary}
        onClearScene={handleClearScene}
        onSelectAdversary={selectAdversary}
        onRemoveAdversary={removeAdversary}
        onUpdateHp={updateAdversaryHp}
        onUpdateStress={updateAdversaryStress}
      />

      {/* SECCIÓN INFERIOR: Sub-Pestañas (Bestiario vs Crear Nuevo Monstruo) */}
      <section style={styles.lowerSection}>
        <div style={styles.subTabsBar}>
          <button
            onClick={() => setSubTab('COMPENDIUM')}
            style={subTab === 'COMPENDIUM' ? styles.subTabBtnActive : styles.subTabBtn}
          >
            📚 Compendio de Monstruos ({templates.length})
          </button>
          <button
            onClick={() => setSubTab('CREATE')}
            style={subTab === 'CREATE' ? styles.subTabBtnActive : styles.subTabBtn}
          >
            ➕ Crear Nuevo Monstruo
          </button>
        </div>

        {subTab === 'COMPENDIUM' && (
          <BestiaryCompendium
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedTier={selectedTier}
            setSelectedTier={setSelectedTier}
            selectedRango={selectedRango}
            setSelectedRango={setSelectedRango}
            filteredTemplates={filteredTemplates}
            spawnQuantities={spawnQuantities}
            onQuantityChange={handleQuantityChange}
            onSpawnTemplate={handleSpawnFromTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onGoToCreate={() => setSubTab('CREATE')}
            remainingSlots={remainingSlots}
            loading={loading}
          />
        )}

        {subTab === 'CREATE' && (
          <CreateMonsterForm
            formData={formData}
            formSpawnQuantity={formSpawnQuantity}
            setFormSpawnQuantity={setFormSpawnQuantity}
            formFeedback={formFeedback}
            onFormChange={handleFormChange}
            onSaveOnlyTemplate={handleSaveOnlyTemplate}
            onSaveAndSpawn={handleSaveAndSpawn}
            onDirectSpawnWithoutSaving={handleDirectSpawnWithoutSaving}
            remainingSlots={remainingSlots}
          />
        )}
      </section>
    </div>
  );
}
