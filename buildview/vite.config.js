import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite + React + Tailwind. Tailwind drives the design phase (industrial theme);
// the app logic and the data seam are unchanged.
// BASE_PATH lets CI host the app under a subpath (e.g. /react/ on GitHub Pages).
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
});
