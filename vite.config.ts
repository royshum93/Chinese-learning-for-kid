import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { webcrypto } from 'node:crypto';

// 簡單 polyfill：若環境沒有 browser-style `crypto.getRandomValues`，
// 就把 Node 的 webcrypto 掛到 globalThis.crypto（供 Vite 與套件使用）。
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = webcrypto as any;
}
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
