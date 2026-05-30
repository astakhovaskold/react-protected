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
    })

  it('allows public routes for everyone', () => {
    const guard = makeGuard(null)
    expect(guard.check({ access: 'public' })).toEqual({ allowed: true })
  })

  it('returns unauthenticated for protected route when no user', () => {
    const guard = makeGuard(null)
    expect(guard.check({ access: 'authenticated' })).toEqual({
      allowed: false,
      reason: 'unauthenticated',
    })
  })

  it('returns authenticated for unauthenticated-only route when user exists', () => {
    const guard = makeGuard({ roles: ['viewer'] })
    expect(guard.check({ access: 'unauthenticated' })).toEqual({
      allowed: false,
      reason: 'authenticated',
    })
  })

  it('allows unauthenticated-only route when no user exists', () => {
    const guard = makeGuard(null)
    expect(guard.check({ access: 'unauthenticated' })).toEqual({ allowed: true })
  })

  it('allows user with correct role', () => {
    const guard = makeGuard({ roles: ['admin'] })
    expect(guard.check({ access: 'authenticated', roles: ['admin'] })).toEqual({
      allowed: true,
    })
  })

  it('returns forbidden for user without required role', () => {
    const guard = makeGuard({ roles: ['viewer'] })
    expect(guard.check({ access: 'authenticated', roles: ['admin'] })).toEqual({
      allowed: false,
      reason: 'forbidden',
    })
  })

  it('allows user with all required permissions', () => {
    const guard = makeGuard({ roles: ['manager'], permissions: ['contracts:read'] })
    expect(
      guard.check({ access: 'authenticated', permissions: ['contracts:read'] })
    ).toEqual({ allowed: true })
  })

  it('returns forbidden for user missing required permissions', () => {
    const guard = makeGuard({ roles: ['manager'], permissions: ['contracts:read'] })
    expect(
      guard.check({ access: 'authenticated', permissions: ['contracts:write'] })
    ).toEqual({ allowed: false, reason: 'forbidden' })
  })

  it('requires auth implicitly when roles are set', () => {
    const guard = makeGuard(null)
    expect(guard.check({ roles: ['admin'] })).toEqual({
      allowed: false,
      reason: 'unauthenticated',
    })
  })

  it('requires auth implicitly when permissions are set', () => {
    const guard = makeGuard(null)
    expect(guard.check({ permissions: ['reports:read'] })).toEqual({
      allowed: false,
      reason: 'unauthenticated',
    })
  })
})
