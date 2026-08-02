import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    // По умолчанию сайт собирается для корня собственного домена.
    // GitHub Pages временно передаёт /sr/ через переменную в workflow.
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
  };
});
