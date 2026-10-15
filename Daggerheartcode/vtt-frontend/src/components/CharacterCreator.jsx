import React, { useState, useEffect } from 'react';
import { useCards, useItems } from '../context/CompendiumContext';
import { getCardDomainName } from './CardSwapModal';
import { STANDARD_ARRAY, matchesDomain } from './characterCreator/characterCreatorConstants';
import { creatorStyles as styles } from './characterCreator/characterCreatorStyles';
import Step1Origins from './characterCreator/Step1Origins';
import Step2Attributes from './characterCreator/Step2Attributes';
import Step3Experiences from './characterCreator/Step3Experiences';
import Step4DomainCards from './characterCreator/Step4DomainCards';
import Step5Equipment from './characterCreator/Step5Equipment';

/**
 * CharacterCreator: Wizard modularizado para crear nuevos héroes de Nivel 1.
 *
 * Pasos:
 *  1. Orígenes: Nombre, Clase, Subclase, Linaje, Comunidad (Step1Origins).
 *  2. Rasgos: Asignación de la matriz estándar (+2, +1, +1, +0, +0, -1) (Step2Attributes).
 *  3. Experiencias: 2 experiencias con bonificador fijo +2 (Step3Experiences).
 *  4. Cartas de Dominio: Selección de 2 cartas Nivel 1 de dominios de clase (Step4DomainCards).
 *  5. Equipamiento: 1 armadura, 2 armas (regla 2 manos) y hasta 5 consumibles (Step5Equipment).
 */
export default function CharacterCreator({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const { cards, loading: loadingCards } = useCards();
  const { items, loading: loadingItems } = useItems();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // --- Datos del Paso 1: Orígenes ---
  const [nombre, setNombre] = useState('');
  const [selectedClaseId, setSelectedClaseId] = useState('');
  const [selectedSubclaseId, setSelectedSubclaseId] = useState('');
  const [selectedLinajeId, setSelectedLinajeId] = useState('');
  const [selectedComunidadId, setSelectedComunidadId] = useState('');

  // Metadatos derivados de la clase
  const [claseMetadata, setClaseMetadata] = useState({
    evasion_base: 10,
    hp_inicial: 6,
    dominios: ['Arcano', 'Medianoche'],
  });

  // --- Datos del Paso 2: Atributos ---
  const [atributos, setAtributos] = useState({
    agilidad: 2,
    fuerza: 1,
    sutileza: 1,
    instinto: 0,
    presencia: 0,
    conocimiento: -1,
  });

  // --- Datos del Paso 3: Experiencias ---
  const [exp1, setExp1] = useState('');
  const [exp2, setExp2] = useState('');

  // --- Datos del Paso 4: Cartas de Dominio (Nivel 1) ---
  const [selectedDomainCardIds, setSelectedDomainCardIds] = useState([]);
  const [filterDomainStep4, setFilterDomainStep4] = useState('all');

  // --- Datos del Paso 5: Equipamiento Inicial ---
  const [selectedArmor, setSelectedArmor] = useState(null);
  const [selectedWeapons, setSelectedWeapons] = useState([]); // Exactamente 2 armas
  const [selectedItems, setSelectedItems] = useState([]); // Hasta 5 objetos/consumibles
  const [searchConsumable, setSearchConsumable] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTrait, setFilterTrait] = useState('all');

  // Inicialización de Linaje y Comunidad al estar disponibles las cartas en caché
  useEffect(() => {
    if (!cards || cards.length === 0) return;

    const linajes = cards.filter((c) => c.tipo === 'Linaje' || c.tipo === 'Ancestro');
    const comunidades = cards.filter((c) => c.tipo === 'Comunidad');

    if (linajes.length > 0 && !selectedLinajeId) setSelectedLinajeId(linajes[0].id);
    if (comunidades.length > 0 && !selectedComunidadId) setSelectedComunidadId(comunidades[0].id);
  }, [cards, selectedLinajeId, selectedComunidadId]);

  function handleClaseChange(id, cardList = cards) {
    setSelectedClaseId(id);
    setSelectedDomainCardIds([]);
    if (!id) {
      setSelectedSubclaseId('');
      return;
    }

    const claseCard = cardList.find((c) => c.id === parseInt(id, 10));
    if (claseCard?.metadata) {
      try {
        const meta = typeof claseCard.metadata === 'string' ? JSON.parse(claseCard.metadata) : (claseCard.metadata || {});
        setClaseMetadata({
          evasion_base: meta.evasion_base || 10,
          hp_inicial: meta.hp_inicial || 6,
          dominios: meta.dominios || ['Arcano', 'Medianoche'],
        });
      } catch (e) {
        console.warn('Error al parsear metadata de clase:', e);
      }
    }

    // Filtrar subclases válidas cuyo metadata.clase_padre coincida con la Clase seleccionada
    const validSubclases = cardList.filter((c) => {
      if (c.tipo !== 'Subclase') return false;
      try {
        const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata) : (c.metadata || {});
        return (
          meta?.clase_padre &&
          meta.clase_padre.trim().toLowerCase() === claseCard?.titulo?.trim().toLowerCase()
        );
      } catch {
        return false;
      }
    });

    if (validSubclases.length > 0) {
      setSelectedSubclaseId(validSubclases[0].id);
    } else {
      setSelectedSubclaseId('');
    }
  }

  function validateStandardArray() {
    const values = Object.values(atributos).sort((a, b) => b - a);
    const expected = [...STANDARD_ARRAY].sort((a, b) => b - a);
    return JSON.stringify(values) === JSON.stringify(expected);
  }

  function toggleWeaponSelection(weapon) {
    setSelectedWeapons((prev) => {
      const exists = prev.some((w) => w.id === weapon.id);
      if (exists) {
        return prev.filter((w) => w.id !== weapon.id);
      } else {
        if (prev.length >= 2) return prev;
        return [...prev, weapon];
      }
    });
  }

  function addInventoryItem(item) {
    setSelectedItems((prev) => {
      if (prev.length >= 5) return prev;
      return [...prev, item];
    });
  }

  function removeInventoryItem(indexToRemove) {
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  function toggleDomainCard(cardId) {
    setSelectedDomainCardIds((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      } else {
        if (prev.length >= 2) return prev;
        return [...prev, cardId];
      }
    });
  }

  // Guardado Final: POST /api/characters con Auto-Equipado Inteligente
  function handleFinalSubmit(e) {
    if (e) e.preventDefault();

    if (!nombre.trim() || !exp1.trim() || !exp2.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos de orígenes y experiencias.');
      return;
    }

    if (!selectedArmor) {
      setErrorMsg('Debes seleccionar exactamente 1 armadura para comenzar tu aventura.');
      return;
    }

    if (selectedWeapons.length !== 2) {
      setErrorMsg('Debes seleccionar exactamente 2 armas para tu personaje.');
      return;
    }

    if (selectedDomainCardIds.length !== 2) {
      setErrorMsg('Debes seleccionar exactamente 2 cartas de dominio de Nivel 1.');
      return;
    }

    if (selectedItems.length > 5) {
      setErrorMsg('Un personaje inicial solo puede llevar un máximo de 5 objetos en su mochila.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const claseCard = cards.find((c) => c.id === parseInt(selectedClaseId, 10));
    const subclaseCard = cards.find((c) => c.id === parseInt(selectedSubclaseId, 10));
    const linajeCard = cards.find((c) => c.id === parseInt(selectedLinajeId, 10));
    const comunidadCard = cards.find((c) => c.id === parseInt(selectedComunidadId, 10));

    const foundationCardIds = [
      claseCard?.id,
      subclaseCard?.id,
      linajeCard?.id,
      comunidadCard?.id,
    ].filter(Boolean);

    const initialDomainCards = cards.filter((c) => selectedDomainCardIds.includes(c.id));

    // LÓGICA DE AUTO-EQUIPADO INICIAL (Fase 3)
    const weapon1 = selectedWeapons[0];
    const weapon2 = selectedWeapons[1];

    let armaPrincipal = weapon1;
    let armaSecundaria = null;
    const finalInventory = [...selectedItems];

    if (weapon1.carga === 2) {
      finalInventory.push(weapon2);
    } else {
      if (weapon2.carga === 1) {
        armaSecundaria = weapon2;
      } else {
        finalInventory.push(weapon2);
      }
    }

    const armaduraActiva = selectedArmor;

    const newHero = {
      nombre: nombre.trim(),
      nivel: 1,
      competencia: 1,
      clase: claseCard?.titulo || 'Aventurero',
      subclase: subclaseCard?.titulo || '',
      ancestro: linajeCard?.titulo || 'Humano',
      comunidad: comunidadCard?.titulo || 'Cosmopolita',
      hpActual: claseMetadata.hp_inicial,
      hpMax: claseMetadata.hp_inicial,
      estresActual: 0,
      estresMax: 6,
      esperanzaActual: 2,
      esperanzaMax: 5,
      evasion: claseMetadata.evasion_base,
      ranurasArmaduraMarcadas: 0,
      atributos: {
        agilidad: parseInt(atributos.agilidad, 10),
        fuerza: parseInt(atributos.fuerza, 10),
        sutileza: parseInt(atributos.sutileza, 10),
        instinto: parseInt(atributos.instinto, 10),
        presencia: parseInt(atributos.presencia, 10),
        conocimiento: parseInt(atributos.conocimiento, 10),
      },
      oro: { punados: 0, sacos: 0, cofres: 0 },
      experiencias: [
        { nombre: exp1.trim(), valor: 2 },
        { nombre: exp2.trim(), valor: 2 },
      ],
      cartasActivasIds: [...foundationCardIds, ...selectedDomainCardIds],
      loadout: initialDomainCards,
      boveda: [],
      armaPrincipal: armaPrincipal,
      armaSecundaria: armaSecundaria,
      armaduraActiva: armaduraActiva,
      inventario: finalInventory,
    };

    fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHero),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((savedChar) => {
        setIsSaving(false);
        if (onComplete) onComplete(savedChar);
      })
      .catch((err) => {
        console.error('[CharacterCreator] Error al guardar héroe:', err);
        setErrorMsg(`Error al guardar: ${err.message}`);
        setIsSaving(false);
      });
  }

  // Filtrado de cartas de dominio para Paso 4
  const level1DomainCards = cards.filter((c) => {
    if (c.tipo !== 'Dominio' || (c.nivel || 1) !== 1) return false;
    const allowed = claseMetadata.dominios || [];
    if (allowed.length === 0) return true;

    const cardDomain = getCardDomainName(c);
    if (cardDomain) {
      return allowed.some((ad) => matchesDomain(cardDomain, ad));
    }
    const textToCheck = `${c.titulo || ''} ${c.descripcion || ''}`.toLowerCase();
    return allowed.some((ad) => textToCheck.includes(ad.toLowerCase()));
  });

  const filteredDomainCards = level1DomainCards.filter((c) => {
    if (filterDomainStep4 === 'all') return true;
    const cardDomain = getCardDomainName(c);
    if (cardDomain) {
      return matchesDomain(cardDomain, filterDomainStep4);
    }
    return true;
  });

  // Filtrado de cartas por tipo
  const clasesDisponibles = cards.filter((c) => c.tipo === 'Clase');
  const linajesDisponibles = cards.filter((c) => c.tipo === 'Linaje' || c.tipo === 'Ancestro');
  const comunidadesDisponibles = cards.filter((c) => c.tipo === 'Comunidad');

  const selectedClaseCard = cards.find((c) => c.id === parseInt(selectedClaseId, 10));
  const subclasesDisponibles = cards.filter((c) => {
    if (c.tipo !== 'Subclase') return false;
    if (!selectedClaseCard) return false;
    try {
      const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata) : (c.metadata || {});
      return (
        meta?.clase_padre &&
        meta.clase_padre.trim().toLowerCase() === selectedClaseCard.titulo.trim().toLowerCase()
      );
    } catch {
      return false;
    }
  });

  // Filtrado de ítems para Paso 5
  const initialWeapons = items.filter(
    (it) => (it.tipo === 'Arma' || it.dadoBase || it.categoria) && (it.tier === 1 || !it.tier)
  );
  const armadurasTier1 = items.filter(
    (it) => (it.tipo === 'Armadura' || it.puntuacionBase) && (it.tier === 1 || !it.tier)
  );
  const availableConsumables = items.filter(
    (item) =>
      !item.dadoBase &&
      !item.puntuacionBase &&
      !item.categoria &&
      item.tipo !== 'Arma' &&
      item.tipo !== 'Armadura' &&
      (item.tier === 1 || !item.tier)
  );

  const filteredConsumables = availableConsumables.filter((it) => {
    if (!searchConsumable.trim()) return true;
    const q = searchConsumable.toLowerCase();
    const nameMatch = it.nombre && it.nombre.toLowerCase().includes(q);
    const descMatch = it.descripcion && it.descripcion.toLowerCase().includes(q);
    return nameMatch || descMatch;
  });

  const filteredWeapons = initialWeapons.filter((w) => {
    const matchCat =
      filterCategory === 'all' ||
      (w.categoria && (
        w.categoria.toLowerCase().includes(filterCategory.toLowerCase()) ||
        filterCategory.toLowerCase().includes(w.categoria.toLowerCase())
      ));
    const matchTrait =
      filterTrait === 'all' ||
      (w.rasgo && w.rasgo.toLowerCase().includes(filterTrait.toLowerCase()));
    return matchCat && matchTrait;
  });

  return (
    <div style={styles.container}>
      {/* Barra de Progreso del Wizard */}
      <div style={styles.wizardHeader}>
        <div>
          <h2 style={styles.wizardTitle}>Forja de Héroe (Nivel 1)</h2>
          <p style={styles.wizardSubtitle}>Crea a tu personaje siguiendo las reglas fundacionales de Daggerheart.</p>
        </div>
        <button onClick={onCancel} style={styles.btnCancelTop}>
          ✕ Cancelar
        </button>
      </div>

      <div style={styles.stepsBar}>
        <div style={step === 1 ? styles.stepBadgeActive : styles.stepBadge}>
          1. Orígenes
        </div>
        <div style={step === 2 ? styles.stepBadgeActive : styles.stepBadge}>
          2. Atributos
        </div>
        <div style={step === 3 ? styles.stepBadgeActive : styles.stepBadge}>
          3. Experiencias
        </div>
        <div style={step === 4 ? styles.stepBadgeActive : styles.stepBadge}>
          4. Cartas de Dominio
        </div>
        <div style={step === 5 ? styles.stepBadgeActive : styles.stepBadge}>
          5. Equipamiento Inicial
        </div>
      </div>

      {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

      {/* PASO 1 */}
      {step === 1 && (
        <Step1Origins
          nombre={nombre}
          setNombre={setNombre}
          selectedClaseId={selectedClaseId}
          handleClaseChange={handleClaseChange}
          clasesDisponibles={clasesDisponibles}
          claseMetadata={claseMetadata}
          selectedSubclaseId={selectedSubclaseId}
          setSelectedSubclaseId={setSelectedSubclaseId}
          subclasesDisponibles={subclasesDisponibles}
          selectedClaseCard={selectedClaseCard}
          selectedLinajeId={selectedLinajeId}
          setSelectedLinajeId={setSelectedLinajeId}
          linajesDisponibles={linajesDisponibles}
          selectedComunidadId={selectedComunidadId}
          setSelectedComunidadId={setSelectedComunidadId}
          comunidadesDisponibles={comunidadesDisponibles}
          onNext={() => setStep(2)}
          setErrorMsg={setErrorMsg}
        />
      )}

      {/* PASO 2 */}
      {step === 2 && (
        <Step2Attributes
          atributos={atributos}
          setAtributos={setAtributos}
          validateStandardArray={validateStandardArray}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          setErrorMsg={setErrorMsg}
        />
      )}

      {/* PASO 3 */}
      {step === 3 && (
        <Step3Experiences
          exp1={exp1}
          setExp1={setExp1}
          exp2={exp2}
          setExp2={setExp2}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
          setErrorMsg={setErrorMsg}
        />
      )}

      {/* PASO 4 */}
      {step === 4 && (
        <Step4DomainCards
          claseMetadata={claseMetadata}
          selectedDomainCardIds={selectedDomainCardIds}
          toggleDomainCard={toggleDomainCard}
          filterDomainStep4={filterDomainStep4}
          setFilterDomainStep4={setFilterDomainStep4}
          filteredDomainCards={filteredDomainCards}
          loadingCards={loadingCards}
          cards={cards}
          onBack={() => setStep(3)}
          onNext={() => setStep(5)}
          setErrorMsg={setErrorMsg}
        />
      )}

      {/* PASO 5 */}
      {step === 5 && (
        <Step5Equipment
          selectedArmor={selectedArmor}
          setSelectedArmor={setSelectedArmor}
          armadurasTier1={armadurasTier1}
          selectedWeapons={selectedWeapons}
          toggleWeaponSelection={toggleWeaponSelection}
          initialWeapons={initialWeapons}
          filteredWeapons={filteredWeapons}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterTrait={filterTrait}
          setFilterTrait={setFilterTrait}
          selectedItems={selectedItems}
          addInventoryItem={addInventoryItem}
          removeInventoryItem={removeInventoryItem}
          availableConsumables={availableConsumables}
          filteredConsumables={filteredConsumables}
          searchConsumable={searchConsumable}
          setSearchConsumable={setSearchConsumable}
          nombre={nombre}
          cards={cards}
          selectedClaseId={selectedClaseId}
          isSaving={isSaving}
          loadingItems={loadingItems}
          handleFinalSubmit={handleFinalSubmit}
          onBack={() => setStep(4)}
        />
      )}
    </div>
  );
}
