import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: ['es2017', 'node14'],
  clean: true,
  dts: true,
  splitting: true,
});
