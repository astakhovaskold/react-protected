import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const packageRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      include: ['src'],
      tsconfigPath: resolve(packageRoot, '../../tsconfig.json'),
    }),
  ],
  build: {
    lib: {
      entry: resolve(packageRoot, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
  },
})
