import React from 'react';

/**
 * MarkdownText - Parser de Markdown inline minimalista.
 *
 * Soporta el subconjunto de Markdown usado en las cartas de Daggerheart:
 *   **texto**  → <strong> (costes y palabras clave)
 *   *texto*    → <em>    (términos de regla)
 *
 * Recibe un string con saltos de línea y renderiza párrafos separados.
 * No requiere dependencias externas.
 *
 * @param {string} text  - Texto con Markdown a renderizar
 * @param {object} style - Estilos adicionales para el contenedor
 */
export default function MarkdownText({ text, style = {} }) {
  if (!text) return null;

  // Dividir en párrafos por saltos de línea
  const paragraphs = text.split('\n').filter((line) => line.trim() !== '');

  return (
    <div style={{ ...styleBase.container, ...style }}>
      {paragraphs.map((paragraph, pIdx) => (
        <p key={pIdx} style={styleBase.paragraph}>
          {parseInline(paragraph)}
        </p>
      ))}
    </div>
  );
}

// =============================================================================
// Parser inline: convierte **bold** y *italic* en elementos React
// =============================================================================

/**
 * Divide una línea de texto en segmentos plain/bold/italic
 * y los convierte en nodos React.
 */
function parseInline(line) {
  const parts = [];
  // Regex: captura **bold** antes que *italic* para evitar conflictos
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    // Texto plano previo al match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: line.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    if (raw.startsWith('**')) {
      parts.push({ type: 'bold', content: raw.slice(2, -2) });
    } else {
      parts.push({ type: 'italic', content: raw.slice(1, -1) });
    }

    lastIndex = match.index + raw.length;
  }

  // Texto plano restante
  if (lastIndex < line.length) {
    parts.push({ type: 'text', content: line.slice(lastIndex) });
  }

  return parts.map((part, i) => {
    switch (part.type) {
      case 'bold':
        return <strong key={i} style={styleBase.bold}>{part.content}</strong>;
      case 'italic':
        return <em key={i} style={styleBase.italic}>{part.content}</em>;
      default:
        return <span key={i}>{part.content}</span>;
    }
  });
}

// =============================================================================
// Estilos
// =============================================================================
const styleBase = {
  container: {
    lineHeight: '1.6',
  },
  paragraph: {
    margin: '0 0 6px 0',
    fontSize: '0.9rem',
    color: '#e8dcc8',
  },
  bold: {
    color: '#d4af37',
    fontWeight: 'bold',
  },
  italic: {
    color: '#b8a080',
    fontStyle: 'italic',
  },
};
