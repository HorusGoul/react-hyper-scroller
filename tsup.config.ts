import { defineConfig } from 'tsup';

export default defineConfig({
  sourcemap: true,
  clean: true,
  outDir: './dist',
  dts: true,
  minify: true,
  entryPoints: ['src/lib/index.ts'],
  format: ['cjs', 'esm', 'iife'],
});
