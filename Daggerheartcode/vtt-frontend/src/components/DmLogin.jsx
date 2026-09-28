import React, { useState } from 'react';

// =============================================================================
// Constante de acceso local para el Dungeon Master
// =============================================================================
const DM_PIN = '8633';

/**
 * DmLogin: Pasarela ligera de seguridad para acceder a la vista del DJ.
 *
 * @param {Function} onLoginSuccess - Callback invocado cuando el PIN es correcto.
 * @param {Function} onCancel - Callback opcional para regresar a la vista de jugador.
 */
export default function DmLogin({ onLoginSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (pin.trim() === DM_PIN) {
      setHasError(false);
      onLoginSuccess();
    } else {
      setHasError(true);
      setPin('');
    }
  }

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.card,
          borderColor: hasError ? '#8b1a1a' : '#4a3728',
          boxShadow: hasError
            ? '0 0 16px rgba(139, 26, 26, 0.4)'
            : '0 0 20px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div style={styles.icon}>👑</div>
        <h2 style={styles.title}>Acceso del Dungeon Master</h2>
        <p style={styles.subtitle}>
          Esta sección contiene información y controles exclusivos para el narrador.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputWrapper}>
            <input
              type="password"
              autoFocus
              maxLength={10}
              placeholder="Introduce el PIN de DJ..."
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (hasError) setHasError(false);
              }}
              style={{
                ...styles.input,
                borderColor: hasError ? '#c0392b' : '#4a3728',
              }}
            />
            {hasError && (
              <span style={styles.errorText}>
                ⚠️ PIN incorrecto. Inténtalo de nuevo.
              </span>
            )}
          </div>

          <div style={styles.buttonsRow}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={styles.btnCancel}
              >
                Volver a Jugador
              </button>
            )}
            <button type="submit" style={styles.btnSubmit}>
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// Estilos
// =============================================================================
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    padding: '20px',
  },
  card: {
    backgroundColor: '#160f08',
    border: '1px solid #4a3728',
    borderRadius: '10px',
    padding: '32px 28px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s ease',
  },
  icon: {
    fontSize: '2.5rem',
  },
  title: {
    margin: 0,
    color: '#d4af37',
    fontSize: '1.3rem',
    letterSpacing: '1px',
  },
  subtitle: {
    margin: 0,
    color: '#a0906a',
    fontSize: '0.85rem',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    marginTop: '10px',
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  },
  input: {
    backgroundColor: '#0d0905',
    color: '#e8dcc8',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    padding: '12px 14px',
    fontSize: '1rem',
    textAlign: 'center',
    letterSpacing: '2px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: '0.8rem',
    fontStyle: 'italic',
  },
  buttonsRow: {
    display: 'flex',
    gap: '10px',
    width: '100%',
  },
  btnCancel: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#a0906a',
    border: '1px solid #4a3728',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
  },
  btnSubmit: {
    flex: 1,
    backgroundColor: '#8b1a1a',
    color: '#f5e6d3',
    border: '1px solid #d4af37',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '1px',
    transition: 'background-color 0.15s ease',
  },
};
