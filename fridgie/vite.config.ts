import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Config de FRIDGIE (web + PWA; base relativa para futuro empaquetado Tauri)
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2020',
    sourcemap: false,
  },
  server: {
    port: 5173,
  },
});
