import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

/**
 * ErrorBoundary: captura errores de render y los muestra en pantalla.
 * Evita la pantalla negra silenciosa durante el desarrollo.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, backgroundColor: '#1a0805', color: '#ff6b6b', fontFamily: 'monospace' }}>
          <h2>💥 Error de renderizado</h2>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 16, color: '#ffaa88' }}>
            {this.state.error.toString()}
          </pre>
          <p style={{ marginTop: 16, color: '#aaa' }}>Revisa la consola del navegador (F12) para más detalles.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
