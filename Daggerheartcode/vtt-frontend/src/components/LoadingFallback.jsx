import React from 'react';

/**
 * LoadingFallback — Placeholder visual ligero para Suspense y carga perezosa de módulos.
 */
export default function LoadingFallback({ message = 'Cargando módulo...' }) {
  return (
    <div style={styles.container}>
      <span style={styles.spinner}>⏳</span>
      <span style={styles.text}>{message}</span>
    </div>
  );
}

const styles = {
  container: {
    padding: '28px 20px',
    textAlign: 'center',
    color: '#d4af37',
    fontStyle: 'italic',
    backgroundColor: '#160e07',
    border: '1px dashed #4a3728',
    borderRadius: '8px',
    margin: '16px auto',
    maxWidth: '450px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  spinner: {
    fontSize: '1.5rem',
  },
  text: {
    fontSize: '0.86rem',
    color: '#c2b39b',
  },
};
