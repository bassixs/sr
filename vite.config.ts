import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    // По умолчанию сайт собирается для корня собственного домена.
    // Для публикации на star40.ru и проверки в CI используется /.
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
  };
});
