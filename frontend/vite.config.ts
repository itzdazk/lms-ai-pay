import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    allowedHosts: ['unlyrical-leonard-flexographic.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable websocket proxy
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Don't log proxy errors for static files when backend is down
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            // Silently handle connection errors for uploads
            // Frontend will show broken image icons instead of console errors
            if (res && !res.headersSent) {
              res.writeHead(503, {
                'Content-Type': 'text/plain',
              })
              res.end('Backend server is not available')
            }
          })
        },
      }
    }
  }
})
