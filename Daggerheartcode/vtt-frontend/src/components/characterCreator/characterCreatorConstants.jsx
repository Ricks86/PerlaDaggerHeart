import React from 'react';

export const STANDARD_ARRAY = [2, 1, 1, 0, 0, -1];

export const ATTRIBUTES = [
  { key: 'agilidad', label: 'Agilidad (AGI)', desc: 'Esquivar, moverse con sigilo, puntería rápida.' },
  { key: 'fuerza', label: 'Fuerza (FUE)', desc: 'Poder físico, resistir daño, combate cuerpo a cuerpo.' },
  { key: 'sutileza', label: 'Sutileza (SUT)', desc: 'Juego de manos, acrobacias, trampas, sutileza.' },
  { key: 'instinto', label: 'Instinto (INS)', desc: 'Percepción, reflejos, conexión con la naturaleza.' },
  { key: 'presencia', label: 'Presencia (PRE)', desc: 'Carisma, liderazgo, intimidación y persuasión.' },
  { key: 'conocimiento', label: 'Conocimiento (CON)', desc: 'Historia, magia arcana, medicina e investigación.' },
];

export const DOMAIN_SYNONYMS = {
  arcana: ['arcana', 'arcano'],
  blade: ['blade', 'cuchilla', 'filo'],
  bone: ['bone', 'hueso'],
  codex: ['codex', 'códice', 'codice'],
  grace: ['grace', 'gracia'],
  midnight: ['midnight', 'medianoche'],
  sage: ['sage', 'sabiduría', 'sabiduria', 'sabio'],
  splendor: ['splendor', 'esplendor'],
  valor: ['valor'],
  dread: ['dread', 'pavor'],
};

export function matchesDomain(cardDomain, allowedDomain) {
  if (!cardDomain || !allowedDomain) return false;
  const c = cardDomain.trim().toLowerCase();
  const a = allowedDomain.trim().toLowerCase();
  if (c === a) return true;
  for (const list of Object.values(DOMAIN_SYNONYMS)) {
    if (list.includes(c) && list.includes(a)) return true;
  }
  return false;
}

export function formatInlineMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ color: '#f0dfbe', fontWeight: 'bold' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} style={{ color: '#d4c29d', fontStyle: 'italic' }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
