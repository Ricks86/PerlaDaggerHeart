import React from 'react';
import { formatInlineMarkdown } from './characterCreatorConstants';
import { creatorStyles as styles } from './characterCreatorStyles';

export default function Step5Equipment({
  selectedArmor,
  setSelectedArmor,
  armadurasTier1,
  selectedWeapons,
  toggleWeaponSelection,
  initialWeapons,
  filteredWeapons,
  filterCategory,
  setFilterCategory,
  filterTrait,
  setFilterTrait,
  selectedItems,
  addInventoryItem,
  removeInventoryItem,
  availableConsumables,
  filteredConsumables,
  searchConsumable,
  setSearchConsumable,
  nombre,
  cards,
  selectedClaseId,
  isSaving,
  loadingItems,
  handleFinalSubmit,
  onBack,
}) {
  const isArmorSelected = !!selectedArmor;
  const isWeaponsComplete = selectedWeapons.length === 2;
  const canSubmit = !isSaving && isArmorSelected && isWeaponsComplete;

  return (
    <form onSubmit={handleFinalSubmit} style={styles.stepContent}>
      <div style={styles.stepIntro}>
        <h4 style={styles.stepSubtitle}>⚔️ Equipamiento Inicial de Aventura</h4>
        <p style={styles.stepDesc}>
          Elige el armamento de Tier 1 con el que comienzas tu viaje. El sistema auto-equipará tus armas evaluando las reglas de carga (2 manos).
        </p>
      </div>

      {/* Sub-sección 1: Armadura (Exactamente 1) */}
      <div style={styles.equipmentGroup}>
        <div style={styles.equipmentGroupHeader}>
          <span style={styles.equipmentGroupTitle}>🛡️ 1. Armadura Inicial (Elige exactamente 1)</span>
          <span style={isArmorSelected ? styles.countBadgeValid : styles.countBadgePending}>
            {isArmorSelected ? '✓ 1 seleccionada' : 'Pendiente (0/1)'}
          </span>
        </div>

        {loadingItems ? (
          <p style={styles.loadingItemsText}>Cargando armaduras...</p>
        ) : armadurasTier1.length === 0 ? (
          <p style={styles.emptyItemsText}>No hay armaduras de Tier 1 disponibles en la base de datos.</p>
        ) : (
          <div style={styles.cardsPickerGrid}>
            {armadurasTier1.map((arm) => {
              const isSelected = selectedArmor?.id === arm.id;
              return (
                <div
                  key={arm.id}
                  onClick={() => setSelectedArmor(arm)}
                  style={isSelected ? styles.pickerCardSelected : styles.pickerCard}
                >
                  <div style={styles.pickerCardTop}>
                    <strong style={styles.pickerItemName}>{arm.nombre}</strong>
                    <span style={styles.pickerItemTier}>Tier {arm.tier}</span>
                  </div>
                  <div style={styles.pickerItemStats}>
                    <span>
                      Ranuras: <strong>{arm.puntuacionBase}</strong>
                    </span>
                    <span>
                      Umbrales: <strong>{arm.umbralMayorBase}/{arm.umbralGraveBase}</strong>
                    </span>
                  </div>
                  {arm.rasgoEspecial && (
                    <div style={styles.pickerWeaponRasgoEspecial} title={arm.rasgoEspecial}>
                      <span style={styles.rasgoEspecialIcon}>📜</span>
                      <span style={styles.rasgoEspecialText}>
                        {formatInlineMarkdown(arm.rasgoEspecial)}
                      </span>
                    </div>
                  )}
                  <div style={styles.pickerCardBottom}>
                    <span style={isSelected ? styles.selectedRadioActive : styles.selectedRadio}>
                      {isSelected ? '✓ Seleccionada' : 'Elegir esta'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sub-sección 2: Armas (Exactamente 2) */}
      <div style={styles.equipmentGroup}>
        <div style={styles.equipmentGroupHeader}>
          <span style={styles.equipmentGroupTitle}>⚔️ 2. Armas Iniciales (Elige exactamente 2)</span>
          <span style={isWeaponsComplete ? styles.countBadgeValid : styles.countBadgePending}>
            {selectedWeapons.length}/2 seleccionadas
          </span>
        </div>

        {/* Barra de Filtros para Armas */}
        <div style={styles.weaponsFilterBar}>
          <div style={styles.filterControl}>
            <label style={styles.filterLabel}>Categoría:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">Todas las Categorías</option>
              <option value="Principal">Armas Principales</option>
              <option value="Secundaria">Armas Secundarias</option>
            </select>
          </div>

          <div style={styles.filterControl}>
            <label style={styles.filterLabel}>Rasgo:</label>
            <select
              value={filterTrait}
              onChange={(e) => setFilterTrait(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">Todos los Rasgos</option>
              <option value="Agilidad">Agilidad</option>
              <option value="Fuerza">Fuerza</option>
              <option value="Sutileza">Sutileza</option>
              <option value="Instinto">Instinto</option>
              <option value="Presencia">Presencia</option>
              <option value="Conocimiento">Conocimiento</option>
            </select>
          </div>

          {(filterCategory !== 'all' || filterTrait !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setFilterCategory('all');
                setFilterTrait('all');
              }}
              style={styles.btnResetFilters}
              title="Restablecer filtros"
            >
              ✕ Limpiar Filtros
            </button>
          )}
        </div>

        {/* Barra de Armas Seleccionadas para persistencia visual */}
        {selectedWeapons.length > 0 && (
          <div style={styles.selectedWeaponsBar}>
            <span style={styles.selectedWeaponsLabel}>
              Armas seleccionadas ({selectedWeapons.length}/2):
            </span>
            <div style={styles.selectedWeaponsPills}>
              {selectedWeapons.map((w) => (
                <span key={w.id} style={styles.weaponPill}>
                  ⚔️ {w.nombre} {w.categoria ? `• ${w.categoria}` : ''} {w.rasgo ? `[${w.rasgo}]` : ''}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWeaponSelection(w);
                    }}
                    style={styles.btnRemovePill}
                    title="Quitar arma seleccionada"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {loadingItems ? (
          <p style={styles.loadingItemsText}>Cargando armas...</p>
        ) : initialWeapons.length === 0 ? (
          <p style={styles.emptyItemsText}>No hay armas de Tier 1 disponibles en la base de datos.</p>
        ) : filteredWeapons.length === 0 ? (
          <div style={styles.emptyFilterBox}>
            <p style={styles.emptyItemsText}>No se encontraron armas que coincidan con los filtros seleccionados.</p>
            <button
              type="button"
              onClick={() => {
                setFilterCategory('all');
                setFilterTrait('all');
              }}
              style={styles.btnResetFilters}
            >
              Mostrar todas las armas
            </button>
          </div>
        ) : (
          <div style={styles.cardsPickerGrid}>
            {filteredWeapons.map((wep) => {
              const isSelected = selectedWeapons.some((w) => w.id === wep.id);
              const isMaxReached = selectedWeapons.length >= 2 && !isSelected;

              return (
                <div
                  key={wep.id}
                  onClick={() => !isMaxReached && toggleWeaponSelection(wep)}
                  style={
                    isSelected
                      ? styles.pickerCardSelected
                      : isMaxReached
                      ? styles.pickerCardDisabled
                      : styles.pickerCard
                  }
                >
                  <div style={styles.pickerCardTop}>
                    <strong style={styles.pickerItemName}>{wep.nombre}</strong>
                    <span
                      style={wep.carga === 2 ? styles.cargaBadge2H : styles.cargaBadge1H}
                    >
                      {wep.carga === 2 ? '2 Manos' : '1 Mano'}
                    </span>
                  </div>
                  <div style={styles.pickerItemStats}>
                    <span>
                      🎲 {wep.dadoBase}
                      {wep.modificadorDano >= 0 ? `+${wep.modificadorDano}` : wep.modificadorDano}{' '}
                      {wep.tipoDano}
                    </span>
                    <span>📍 {wep.alcance}</span>
                  </div>
                  {wep.rasgo && (
                    <span style={styles.pickerItemSpecial}>⚡ {wep.rasgo}</span>
                  )}
                  {wep.rasgoEspecial && (
                    <div style={styles.pickerWeaponRasgoEspecial} title={wep.rasgoEspecial}>
                      <span style={styles.rasgoEspecialIcon}>📜</span>
                      <span style={styles.rasgoEspecialText}>
                        {formatInlineMarkdown(wep.rasgoEspecial)}
                      </span>
                    </div>
                  )}
                  <div style={styles.pickerCardBottom}>
                    <span style={isSelected ? styles.selectedRadioActive : styles.selectedRadio}>
                      {isSelected ? '✓ Seleccionada' : isMaxReached ? 'Límite alcanzado' : '+ Elegir'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sub-sección 3: Inventario Rápido (Hasta 5) */}
      <div style={styles.equipmentGroup}>
        <div style={styles.equipmentGroupHeader}>
          <span style={styles.equipmentGroupTitle}>🎒 3. Inventario y Consumibles (Elige hasta 5)</span>
          <span style={selectedItems.length === 5 ? styles.countBadgeValid : styles.countBadge}>
            {selectedItems.length}/5 objetos en mochila
          </span>
        </div>

        <div style={styles.inventoryPickerContainer}>
          {/* Columna Izquierda: Catálogo para agregar */}
          <div style={styles.inventoryPickerCatalog}>
            <div style={styles.invCatalogHeader}>
              <span style={styles.invSubTitle}>Objetos Disponibles ({filteredConsumables.length}):</span>
              <input
                type="text"
                placeholder="🔍 Filtrar..."
                value={searchConsumable}
                onChange={(e) => setSearchConsumable(e.target.value)}
                style={styles.invSearchInput}
              />
            </div>
            <div style={styles.invScrollList}>
              {filteredConsumables.length === 0 ? (
                <p style={styles.emptyInvText}>
                  {availableConsumables.length === 0
                    ? 'No hay consumibles disponibles en el catálogo.'
                    : 'No se encontraron consumibles con ese filtro.'}
                </p>
              ) : (
                filteredConsumables.map((it) => {
                  const atLimit = selectedItems.length >= 5;
                  return (
                    <div key={it.id} style={styles.invCatalogRow}>
                      <div style={styles.invRowMeta} title={it.descripcion || ''}>
                        <span style={styles.invRowIcon}>🧪</span>
                        <span style={styles.invRowName}>{it.nombre}</span>
                        <span style={styles.invRowDesc}>
                          {it.descripcion || `Tier ${it.tier || 1}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addInventoryItem(it)}
                        disabled={atLimit}
                        style={atLimit ? styles.btnAddInvDisabled : styles.btnAddInv}
                        title={
                          atLimit
                            ? 'Mochila llena (máximo 5 al crear personaje)'
                            : 'Añadir a la mochila'
                        }
                      >
                        + Añadir
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Columna Derecha: Objetos en mochila seleccionados */}
          <div style={styles.inventoryPickerSelected}>
            <span style={styles.invSubTitle}>Contenido de tu Mochila ({selectedItems.length}/5):</span>
            {selectedItems.length === 0 ? (
              <p style={styles.emptyInvText}>
                No has añadido objetos adicionales a tu mochila aún (opcional, máx 5).
              </p>
            ) : (
              <div style={styles.invScrollList}>
                {selectedItems.map((it, idx) => (
                  <div key={`${it.id}-${idx}`} style={styles.invSelectedRow}>
                    <span style={styles.invSelectedName} title={it.nombre}>
                      {it.tipo === 'Consumible' ? '🧪' : '📦'} {it.nombre}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeInventoryItem(idx)}
                      style={styles.btnRemoveInv}
                      title="Quitar de la mochila"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumen Final de Auto-Equipado */}
      <div style={styles.summaryCard}>
        <h5 style={styles.summaryTitle}>Resumen del Héroe Listo para Aventura</h5>
        <div style={styles.summaryList}>
          <span>
            Héroe: <strong>{nombre}</strong>
          </span>
          <span>
            Clase: <strong>{cards.find((c) => c.id === parseInt(selectedClaseId, 10))?.titulo}</strong>
          </span>
          <span>
            Armadura: <strong>{selectedArmor?.nombre || '— Sin Armadura —'}</strong>
          </span>
          <span>
            Armas: <strong>{selectedWeapons.map((w) => w.nombre).join(' + ') || '—'}</strong>
          </span>
          <span>
            Mano Principal: <strong>{selectedWeapons[0]?.nombre || '—'}</strong>
          </span>
          <span>
            Mano Secundaria:{' '}
            <strong>
              {selectedWeapons[0]?.carga === 2
                ? '🔒 Desarmada (Arma Principal de 2 Manos)'
                : selectedWeapons[1]?.carga === 1
                ? selectedWeapons[1]?.nombre
                : '🔒 En Inventario (Carga 2)'}
            </strong>
          </span>
        </div>
      </div>

      <div style={styles.navRow}>
        <button type="button" onClick={onBack} style={styles.btnBack}>
          ⬅ Volver a Cartas de Dominio
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          style={!canSubmit ? styles.btnDisabled : styles.btnSubmitFinal}
        >
          {isSaving ? 'Forjando Héroe...' : '⚔️ Finalizar y Forjar Héroe'}
        </button>
      </div>
    </form>
  );
}
