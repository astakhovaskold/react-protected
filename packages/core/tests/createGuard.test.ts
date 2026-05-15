import { describe, expect, it } from 'vitest'

import { createGuard } from '../src/createGuard'

describe('createGuard', () => {
  type User = {
    roles: Array<string>
    permissions?: Array<string>
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
    expect(guard.check({ path: '/', access: 'public' })).toEqual({ allowed: true })
  })

  it('redirects unauthenticated user from protected route to loginPath', () => {
    const guard = makeGuard(null)
    const result = guard.check({ path: '/dashboard', access: 'authenticated' })
    expect(result).toEqual({ allowed: false, reason: 'unauthenticated', redirectTo: '/login' })
  })

  it('redirects authenticated user from guest-only route to defaultPath', () => {
    const guard = makeGuard({ roles: ['viewer'] })
    const result = guard.check({ path: '/login', access: 'guest-only' })
    expect(result).toEqual({ allowed: false, reason: 'guest-only', redirectTo: '/dashboard' })
  })

  it('allows user with correct role', () => {
    const guard = makeGuard({ roles: ['admin'] })
    const result = guard.check({ path: '/admin', access: 'authenticated', roles: ['admin'] })
    expect(result).toEqual({ allowed: true })
  })

  it('forbids user without required role', () => {
    const guard = makeGuard({ roles: ['viewer'] })
    const result = guard.check({ path: '/admin', access: 'authenticated', roles: ['admin'] })
    expect(result).toEqual({ allowed: false, reason: 'forbidden', redirectTo: '/403' })
  })

  it('allows user with required permissions', () => {
    const guard = makeGuard({ roles: ['manager'], permissions: ['contracts:read'] })
    const result = guard.check({
      path: '/contracts',
      access: 'authenticated',
      permissions: ['contracts:read'],
    })
    expect(result).toEqual({ allowed: true })
  })

  it('forbids user without required permissions', () => {
    const guard = makeGuard({ roles: ['manager'], permissions: ['contracts:read'] })
    const result = guard.check({
      path: '/contracts/new',
      access: 'authenticated',
      permissions: ['contracts:write'],
    })
    expect(result).toEqual({ allowed: false, reason: 'forbidden', redirectTo: '/403' })
  })

  it('requires auth implicitly when roles are set without explicit access', () => {
    const guard = makeGuard(null)
    const result = guard.check({ path: '/admin', roles: ['admin'] })
    expect(result).toEqual({ allowed: false, reason: 'unauthenticated', redirectTo: '/login' })
  })

  it('requires auth implicitly when permissions are set without explicit access', () => {
    const guard = makeGuard(null)
    const result = guard.check({ path: '/reports', permissions: ['reports:read'] })
    expect(result).toEqual({ allowed: false, reason: 'unauthenticated', redirectTo: '/login' })
  })
})
