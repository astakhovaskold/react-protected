import type { AccessResult, Guard, GuardOptions, RouteConfig } from './types'

export function createGuard<TUser = unknown>(options: GuardOptions<TUser>): Guard<TUser> {
  const resolved = {
    getUser: options.getUser,
    isAuthenticated: options.isAuthenticated ?? ((user) => user !== null),
    hasRole: options.hasRole ?? (() => false),
    hasPermission: options.hasPermission ?? (() => false),
  } as Required<GuardOptions<TUser>>

  const check = (route: RouteConfig): AccessResult => {
    const user = resolved.getUser()
    const authenticated = resolved.isAuthenticated(user)
    const access = route.access ?? 'public'
    const requiresAuth =
      access === 'authenticated' ||
      Boolean(route.roles?.length) ||
      Boolean(route.permissions?.length)

    if (access === 'guest-only' && authenticated) {
      return { allowed: false, reason: 'guest-only' }
    }

    if (requiresAuth && !authenticated) {
      return { allowed: false, reason: 'unauthenticated' }
    }

    if (route.roles?.length && user) {
      if (!resolved.hasRole(user, route.roles)) {
        return { allowed: false, reason: 'forbidden' }
      }
    }

    if (route.permissions?.length && user) {
      if (!resolved.hasPermission(user, route.permissions)) {
        return { allowed: false, reason: 'forbidden' }
      }
    }

    return { allowed: true }
  }

  return { check, options: resolved }
}
