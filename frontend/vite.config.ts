import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000, // Changed to 3000 for Platform
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: ['.emergent.run', 'localhost', 'gemini-scaler.preview.emergentagent.com'],
      proxy: {
        '/api': {
          target: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001',
          changeOrigin: true,
        },
        '/functions/v1': {
            target: 'http://localhost:8001/api', // Bridge Supabase Functions -> Python
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/functions\/v1/, '')
        }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
