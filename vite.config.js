import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Le front appelle "/api/..." : Vite redirige vers le serveur Express (port 4000).
// Aucune URL en dur dans le code, et pas de problème CORS en développement.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:4000' } },
})
