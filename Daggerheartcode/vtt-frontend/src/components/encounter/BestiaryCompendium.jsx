import React from 'react';
import TemplateCard from './TemplateCard';
import { encounterStyles as styles } from './encounterStyles';

/**
 * BestiaryCompendium: Vista del catálogo de moldes con buscador en tiempo real,
 * filtros por Tier y Rango, y cuadrícula de tarjetas de invocación.
 */
export default function BestiaryCompendium({
  searchQuery,
  setSearchQuery,
  selectedTier,
  setSelectedTier,
  selectedRango,
  setSelectedRango,
  filteredTemplates,
  spawnQuantities,
  onQuantityChange,
  onSpawnTemplate,
  onDeleteTemplate,
  onGoToCreate,
  remainingSlots,
  loading = false,
}) {
  return (
    <div style={styles.compendiumView}>
      {/* Barra de Búsqueda y Filtros */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={styles.searchClearBtn}>
              ✕
            </button>
          )}
        </div>

        <div style={styles.filterControls}>
          <label style={styles.filterLabel}>Tier:</label>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="ALL">Todos</option>
            <option value="1">Tier 1</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
            <option value="4">Tier 4</option>
          </select>

          <label style={styles.filterLabel}>Rango:</label>
          <select
            value={selectedRango}
            onChange={(e) => setSelectedRango(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="ALL">Todos</option>
            <option value="Menor">Menor</option>
            <option value="Estándar">Estándar</option>
            <option value="Horda">Horda</option>
            <option value="Líder">Líder</option>
            <option value="Solitario">Solitario</option>
          </select>
        </div>
      </div>

      {/* Listado de Tarjetas de Moldes del Bestiario */}
      {filteredTemplates.length === 0 ? (
        <div style={styles.emptyTemplatesState}>
          <p>No se encontraron monstruos que coincidan con la búsqueda o el compendio está vacío.</p>
          <button onClick={onGoToCreate} style={styles.btnGoCreate}>
            + Crear el primer monstruo
          </button>
        </div>
      ) : (
        <div style={styles.templatesGrid}>
          {filteredTemplates.map((tpl) => {
            const qty = spawnQuantities[tpl.id] || 1;
            return (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                quantity={qty}
                onQuantityChange={onQuantityChange}
                onSpawn={onSpawnTemplate}
                onDelete={onDeleteTemplate}
                remainingSlots={remainingSlots}
                loading={loading}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
