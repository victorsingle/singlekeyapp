import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log("🔍 VITE_SUPABASE_FUNCTION_URL in build:", env.VITE_SUPABASE_FUNCTION_URL);

  return {
    root: '.', // <- raiz do projeto onde está o index.html
    plugins: [react()],
    define: {
      'process.env': env,
      'import.meta.env': {
        VITE_SUPABASE_FUNCTION_URL: JSON.stringify(env.VITE_SUPABASE_FUNCTION_URL),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'), // <- força ponto de entrada
        },
      },
    },
    server: {
      open: true, // abre automaticamente no navegador
      port: 5173,
    },
  };
});
