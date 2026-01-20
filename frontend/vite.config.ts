import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 8081,
      strictPort: true,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:8082',
          changeOrigin: true,
        },
        '/file': {
          target: 'http://localhost:8082',
          changeOrigin: true,
        },
        // Proxy para las imágenes generadas (estáticos en el root del servidor python)
        '/bench_results': {
          target: 'http://localhost:8082',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/bench_results/, '')
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
