import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// En desarrollo, Vite hace de proxy reverso (replicando lo que en
// produccion hace Nginx dentro del contenedor del frontend).
// El navegador siempre llama a "/api/v1/..." sobre el mismo origen.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/v1/ventas': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/v1/despachos': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
