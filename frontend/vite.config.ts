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
  build: {
    rollupOptions: {
      output: {
        // Tối ưu code splitting - chỉ tách vendor code lớn
        manualChunks: (id) => {
          // Tách node_modules thành vendor chunk
          if (id.includes('node_modules')) {
            // Tách React và React-DOM riêng (thường được dùng chung)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            // Tách các thư viện UI lớn
            if (id.includes('lucide-react') || id.includes('recharts') || id.includes('date-fns')) {
              return 'vendor-ui'
            }
            // Các thư viện khác vào vendor chunk chung
            return 'vendor'
          }
          // Giữ các file trong src/lib/api cùng nhau (sẽ được lazy load theo route)
          // Không cần tách manual vì Vite sẽ tự động tối ưu
        },
        // Giảm số lượng chunks bằng cách gộp các file nhỏ
        chunkSizeWarningLimit: 1000,
      },
    },
    // Tối ưu chunk size
    chunkSizeWarningLimit: 1000,
    // Không preload tất cả chunks - chỉ preload khi cần
    assetsInlineLimit: 4096,
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
