import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

// Config de FRIDGIE (web + PWA; base relativa para futuro empaquetado Tauri)
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    // Versión única desde package.json (la usa la UI en Ajustes/Descargar)
    __FRIDGIE_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
  server: {
    port: 5173,
  },
});
