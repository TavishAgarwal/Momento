import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl()
  ],
  server: {
    host: true, // Listen on all network interfaces
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        secure: false, // Don't verify SSL for local proxy
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        secure: false,
      },
    },
  },
})
