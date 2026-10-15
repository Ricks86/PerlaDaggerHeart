import React from 'react';
import { creatorStyles as styles } from './characterCreatorStyles';

export default function Step1Origins({
  nombre,
  setNombre,
  selectedClaseId,
  handleClaseChange,
  clasesDisponibles,
  claseMetadata,
  selectedSubclaseId,
  setSelectedSubclaseId,
  subclasesDisponibles,
  selectedClaseCard,
  selectedLinajeId,
  setSelectedLinajeId,
  linajesDisponibles,
  selectedComunidadId,
  setSelectedComunidadId,
  comunidadesDisponibles,
  onNext,
  setErrorMsg,
}) {
  const handleProceed = () => {
    if (!nombre.trim()) {
      setErrorMsg('Ingresa un nombre para tu héroe.');
      return;
    }
    if (!selectedClaseId) {
      setErrorMsg('Debes elegir una Clase para tu héroe.');
      return;
    }
    if (!selectedSubclaseId) {
      setErrorMsg('Debes elegir una Subclase válida para continuar.');
      return;
    }
    setErrorMsg(null);
    onNext();
  };

  return (
    <div style={styles.stepContent}>
      <div style={styles.inputGroup}>
        <label style={styles.label}>Nombre del Héroe:</label>
        <input
          type="text"
          required
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Eryndor, Kaelen, Lyra..."
          style={styles.inputLarge}
        />
      </div>

      <div style={styles.selectorsGrid}>
        {/* 1. Clase */}
        <div style={styles.selectorCard}>
          <label style={styles.label}>1. Clase:</label>
          <select
            value={selectedClaseId}
            onChange={(e) => handleClaseChange(e.target.value)}
            style={styles.select}
          >
            <option value="">-- Selecciona una Clase --</option>
            {clasesDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
          {selectedClaseId && (
            <div style={styles.cardPreview}>
              <div style={styles.metaPreviewRow}>
                <span>
                  Evasión Base: <strong>{claseMetadata.evasion_base}</strong>
                </span>
                <span>
                  HP Máximo: <strong>{claseMetadata.hp_inicial}</strong>
                </span>
              </div>
              <div style={styles.domainsRow}>
                Dominios: {(claseMetadata.dominios || []).join(' · ')}
              </div>
            </div>
          )}
        </div>

        {/* 2. Subclase */}
        <div style={styles.selectorCard}>
          <label style={styles.label}>
            2. Subclase:
            {!selectedClaseId && <span style={styles.disabledHint}>(Elige una Clase primero)</span>}
          </label>
          <select
            value={selectedSubclaseId}
            onChange={(e) => setSelectedSubclaseId(e.target.value)}
            disabled={!selectedClaseId}
            style={{
              ...styles.select,
              ...(!selectedClaseId ? styles.selectDisabled : {}),
            }}
          >
            {!selectedClaseId ? (
              <option value="">-- Elige una Clase primero --</option>
            ) : subclasesDisponibles.length === 0 ? (
              <option value="">-- No hay subclases para {selectedClaseCard?.titulo} --</option>
            ) : (
              <>
                <option value="">-- Selecciona una Subclase --</option>
                {subclasesDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titulo}
                  </option>
                ))}
              </>
            )}
          </select>
          {selectedSubclaseId && (
            <div style={{ ...styles.cardPreview, marginTop: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#c8b898' }}>
                {subclasesDisponibles.find((c) => c.id === parseInt(selectedSubclaseId, 10))?.descripcion}
              </p>
            </div>
          )}
        </div>

        {/* 3. Linaje */}
        <div style={styles.selectorCard}>
          <label style={styles.label}>3. Linaje:</label>
          <select
            value={selectedLinajeId}
            onChange={(e) => setSelectedLinajeId(e.target.value)}
            style={styles.select}
          >
            {linajesDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Comunidad */}
        <div style={styles.selectorCard}>
          <label style={styles.label}>4. Comunidad:</label>
          <select
            value={selectedComunidadId}
            onChange={(e) => setSelectedComunidadId(e.target.value)}
            style={styles.select}
          >
            {comunidadesDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.navRow}>
        <span style={styles.hint}>Las 4 cartas elegidas se añadirán como tus cartas activas iniciales.</span>
        <button onClick={handleProceed} style={styles.btnNext}>
          Siguiente: Asignar Rasgos ➔
        </button>
      </div>
    </div>
  );
}
