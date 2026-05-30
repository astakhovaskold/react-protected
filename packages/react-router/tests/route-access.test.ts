import { createGuard } from '@react-protected/core'
import { describe, expect, it } from 'vitest'

import {
  resolveRouteAccess,
  type RouteAccessResult,
} from '../src/utils/route-access'

function createTestGuard(user: null | { role?: string; permissions?: Array<string> }) {
  return createGuard({
    getUser: () => user,
    hasRole: (currentUser, roles) => roles.includes(currentUser.role ?? ''),
    hasPermission: (currentUser, permissions) =>
      permissions.every((permission) => currentUser.permissions?.includes(permission)),
  })
}

describe('route access primitives', () => {
  it.each<[string, null | { role?: string; permissions?: Array<string> }, Parameters<typeof resolveRouteAccess>[1], RouteAccessResult]>([
    [
      'allows unauthenticated-only routes for anonymous users',
      null,
      { access: 'unauthenticated' },
      { allowed: true },
    ],
    [
      'rejects authenticated users from unauthenticated-only routes',
      { role: 'member' },
      { access: 'unauthenticated' },
      { allowed: false, reason: 'authenticated' },
    ],
    [
      'returns unauthenticated for protected routes without user',
      null,
      { access: 'authenticated' },
      { allowed: false, reason: 'unauthenticated' },
    ],
    [
      'returns forbidden when role check fails',
      { role: 'member' },
      { roles: ['admin'] },
      { allowed: false, reason: 'forbidden' },
    ],
    [
      'returns forbidden when permission check fails',
      { permissions: ['reports:read'] },
      { permissions: ['reports:write'] },
      { allowed: false, reason: 'forbidden' },
    ],
    [
      'allows access when permission check passes',
      { permissions: ['reports:read'] },
      { permissions: ['reports:read'] },
      { allowed: true },
    ],
  ])('%s', (_, user, config, expected) => {
    expect(resolveRouteAccess(createTestGuard(user), config)).toEqual(expected)
  })
})
