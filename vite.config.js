import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import chatHandler from './api/chat.js';

export default defineConfig(({ mode }) => {
  // Expose .env vars (e.g. GEMINI_API_KEY) to the /api/chat middleware
  const env = loadEnv(mode, process.cwd(), '');
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-chat',
        configureServer(server) {
          server.middlewares.use('/api/chat', chatHandler);
        },
      },
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
  };
});