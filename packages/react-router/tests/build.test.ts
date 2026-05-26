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
      access(join(distDir, 'testing.js')),
      access(join(distDir, 'testing.cjs')),
      access(join(distDir, 'testing.d.ts')),
    ])
  })

  it('preserves public JSDoc in declaration output', async () => {
    await rm(distDir, { recursive: true, force: true })

    await build({
      root: packageRoot,
      logLevel: 'silent',
    })

    const [accessRouteDeclarations, createAccessRouterDeclarations, testingDeclarations] = await Promise.all([
      readFile(join(distDir, 'AccessRoute.d.ts'), 'utf8'),
      readFile(join(distDir, 'createAccessRouter.d.ts'), 'utf8'),
      readFile(join(distDir, 'testing.d.ts'), 'utf8'),
    ])

    expect(accessRouteDeclarations).toContain(
      'Protects a route element and redirects when access is denied.'
    )
    expect(createAccessRouterDeclarations).toContain(
      'Creates a browser router with access checks applied to protected routes.'
    )
    expect(testingDeclarations).toContain('Test helper that provides a predictable access context.')
  })
})
