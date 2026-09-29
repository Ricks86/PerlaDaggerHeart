import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // sockjs-client usa la variable `global` de Node.js, que no existe en el navegador.
  // Esto la reemplaza en tiempo de build con `globalThis` (estándar web).
  define: {
    global: 'globalThis',
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws-daggerheart': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },


  build: {
    emptyOutDir: false,
  },

  optimizeDeps: {
    include: ['sockjs-client', '@stomp/stompjs'],
  },
});
