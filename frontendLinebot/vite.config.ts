import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true, // Abre o navegador automaticamente
    host: true, // Permite acesso externo
  },
  optimizeDeps: {
    include: ['lucide-react'],
  },
})