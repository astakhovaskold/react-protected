import { describe, it, expect } from 'vitest'
import { createGuard } from '../src/createGuard'

describe('createGuard', () => {
  type User = {
    roles: string[]
    permissions?: string[]
  }

  const makeGuard = (user: User | null) =>
    createGuard({
      getUser: () => user,
      hasRole: (u, roles) => roles.some((r) => u.roles.includes(r)),
      hasPermission: (u, permissions) =>
        permissions.every((permission) => u.permissions?.includes(permission)),
      loginPath: '/login',
      forbiddenPath: '/403',
      defaultPath: '/dashboard',
    })

  it('allows public routes for everyone', () => {
    const guard = makeGuard(null)
    const result = guard.check({ path: '/', access: 'public' }, '/')
    expect(result.allowed).toBe(true)
  })

  it('redirects unauthenticated user from protected route', () => {
    const guard = makeGuard(null)
    const result = guard.check({ path: '/dashboard', access: 'authenticated' }, '/dashboard')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toBe('unauthenticated')
      expect(result.redirectTo).toContain('/login')
      expect(result.redirectTo).toContain('callbackUrl=%2Fdashboard')
    }
  })

  it('redirects authenticated user from guest-only route', () => {
    const guard = makeGuard({ roles: ['viewer'] })
    const result = guard.check({ path: '/login', access: 'guest-only' }, '/login')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toBe('guest-only')
      expect(result.redirectTo).toBe('/dashboard')
    }
  })

  it('allows user with correct role', () => {
    const guard = makeGuard({ roles: ['admin'] })
    const result = guard.check({ path: '/admin', access: 'authenticated', roles: ['admin'] }, '/admin')
    expect(result.allowed).toBe(true)
  })

  it('forbids user without required role', () => {
    const guard = makeGuard({ roles: ['viewer'] })
    const result = guard.check({ path: '/admin', access: 'authenticated', roles: ['admin'] }, '/admin')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toBe('forbidden')
      expect(result.redirectTo).toBe('/403')
    }
  })

  it('allows user with required permissions', () => {
    const guard = makeGuard({ roles: ['manager'], permissions: ['contracts:read'] })
    const result = guard.check(
      { path: '/contracts', access: 'authenticated', permissions: ['contracts:read'] },
      '/contracts'
    )
    expect(result.allowed).toBe(true)
  })

  it('forbids user without required permissions', () => {
    const guard = makeGuard({ roles: ['manager'], permissions: ['contracts:read'] })
    const result = guard.check(
      { path: '/contracts/new', access: 'authenticated', permissions: ['contracts:write'] },
      '/contracts/new'
    )
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toBe('forbidden')
      expect(result.redirectTo).toBe('/403')
    }
  })

  it('redirects unauthenticated user when roles are configured without explicit access', () => {
    const guard = makeGuard(null)
    const result = guard.check({ path: '/admin', roles: ['admin'] }, '/admin')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toBe('unauthenticated')
      expect(result.redirectTo).toContain('/login')
      expect(result.redirectTo).toContain('callbackUrl=%2Fadmin')
    }
  })

  it('encodes callback url and preserves existing login query params', () => {
    const guard = createGuard({
      getUser: () => null,
      loginPath: '/login?from=header',
      callbackUrlParam: 'next',
    })

    const result = guard.check(
      { path: '/dashboard', access: 'authenticated' },
      '/dashboard?tab=security'
    )

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toBe('unauthenticated')
      expect(result.redirectTo).toBe(
        '/login?from=header&next=%2Fdashboard%3Ftab%3Dsecurity'
      )
    }
  })
})
