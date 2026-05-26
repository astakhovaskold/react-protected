import { access, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'vite'
import { describe, expect, it } from 'vitest'

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

  it('preserves public JSDoc in declaration output', async () => {
    await rm(distDir, { recursive: true, force: true })

    await build({
      root: packageRoot,
      logLevel: 'silent',
    })

    const [createGuardDeclarations, typeDeclarations] = await Promise.all([
      readFile(join(distDir, 'createGuard.d.ts'), 'utf8'),
      readFile(join(distDir, 'types.d.ts'), 'utf8'),
    ])

    expect(createGuardDeclarations).toContain(
      'Creates a guard that evaluates access against the current user.'
    )
    expect(typeDeclarations).toContain('Access requirements consumed by')
  })
})
