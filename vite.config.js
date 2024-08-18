import { resolve } from 'path'
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      name: 'nanosignals',
      fileName: `nanosignals`,
    },
    formats: ['es'],
    target: "esnext"
  },
});