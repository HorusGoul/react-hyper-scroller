import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import istanbulPlugin from 'vite-plugin-istanbul';

// https://vitejs.dev/config/
export default defineConfig({
  root: path.resolve(__dirname, '../src'),

  build: {
    outDir: '../dist',

    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'object-assign'],

      input: {
        main: path.resolve(__dirname, '../src/index.html'),
        scrollRestoration: path.resolve(
          __dirname,
          '../src/demos/scroll-restoration.html',
        ),
      },

      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
  plugins: [
    react({
      jsxRuntime: 'classic',
    }),
    istanbulPlugin({
      include: 'src/lib/*',
      exclude: ['node_modules', 'e2e'],
      extension: ['.ts', '.tsx'],
      requireEnv: true,
    }),
  ],
});
