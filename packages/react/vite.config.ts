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
      entry: {
        index: resolve(packageRoot, 'src/index.ts'),
        testing: resolve(packageRoot, 'src/testing.tsx'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@react-protected/core'],
    },
  },
})
