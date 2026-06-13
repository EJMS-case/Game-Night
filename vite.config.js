import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the build works under any path (e.g. GitHub Pages project subpath).
  base: './',
  server: {
    host: true,
    port: 5173,
  },
})
