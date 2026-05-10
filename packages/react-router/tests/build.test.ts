import { access, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'vite'
import { describe, it } from 'vitest'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const distDir = join(packageRoot, 'dist')

describe('package build', () => {
  it('emits library artifacts', async () => {
    await rm(distDir, { recursive: true, force: true })

    await build({
      root: packageRoot,
      logLevel: 'silent',
    })

    await Promise.all([
      access(join(distDir, 'index.js')),
      access(join(distDir, 'index.cjs')),
      access(join(distDir, 'index.d.ts')),
    ])
  })
})
