import { describe, it, expect } from 'vitest'
import { createGuard } from '../src/createGuard'

// TODO: покрыть все сценарии

describe('createGuard', () => {
  const makeGuard = (user: { roles: string[] } | null) =>
    createGuard({
      getUser: () => user,
      hasRole: (u, roles) => roles.some((r) => u.roles.includes(r)),
      loginPath: '/login',
      forbiddenPath: '/403',
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
      expect(result.redirectTo).toContain('callbackUrl=/dashboard')
    }
  })

  it('redirects authenticated user from guest-only route', () => {
    const guard = makeGuard({ roles: ['viewer'] })
    const result = guard.check({ path: '/login', access: 'guest-only' }, '/login')
    expect(result.allowed).toBe(false)
    if (!result.allowed) expect(result.reason).toBe('guest-only')
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
    if (!result.allowed) expect(result.reason).toBe('forbidden')
  })
})
