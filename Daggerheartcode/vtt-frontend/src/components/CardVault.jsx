import React from 'react';
import DomainCardsPanel from './DomainCardsPanel';

/**
 * CardVault — Compatibilidad con versiones anteriores.
 * En Sprint 26, el panel de cartas ha sido rediseñado como DomainCardsPanel
 * dividiendo Mazo Activo (Loadout máx. 5) y Bóveda (Vault).
 */
export default function CardVault() {
  return <DomainCardsPanel />;
}
