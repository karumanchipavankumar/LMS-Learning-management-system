import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/lms-videos': {
                target: 'http://49.205.66.47:9000',
                changeOrigin: true
            }
        }
    }
})
