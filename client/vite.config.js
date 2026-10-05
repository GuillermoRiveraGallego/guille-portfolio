import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Se publica en GitHub Pages bajo /guille-portfolio/ (https://<usuario>.github.io/guille-portfolio/).
  base: '/guille-portfolio/',

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    // three.js ronda los 1.2 MB y va en el chunk de las páginas 3D (lazy), no en el inicial
    chunkSizeWarningLimit: 1500,
  },
});
