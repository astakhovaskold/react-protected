import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const packageRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      include: ['src'],
      pathsToAliases: false,
      tsconfigPath: resolve(packageRoot, '../../tsconfig.json'),
    }),
  ],
  build: {
    lib: {
      entry: resolve(packageRoot, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-router-dom', '@react-protected/core'],
    },
  },
})
