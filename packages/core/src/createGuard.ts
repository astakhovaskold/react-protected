import type { AccessResult, Guard, GuardOptions, RouteConfig } from './types'

export function createGuard<TUser = unknown>(options: GuardOptions<TUser>): Guard<TUser> {
  const resolved = {
    getUser: options.getUser,
    isAuthenticated: options.isAuthenticated ?? ((user) => user !== null),
    hasRole: options.hasRole ?? (() => false),
    hasPermission: options.hasPermission ?? (() => false),
    loginPath: options.loginPath ?? '/login',
    forbiddenPath: options.forbiddenPath ?? '/403',
    defaultPath: options.defaultPath ?? '/',
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
      return { allowed: false, reason: 'guest-only', redirectTo: resolved.defaultPath }
    }

    if (requiresAuth && !authenticated) {
      return { allowed: false, reason: 'unauthenticated', redirectTo: resolved.loginPath }
    }

    if (route.roles?.length && user) {
      if (!resolved.hasRole(user, route.roles)) {
        return { allowed: false, reason: 'forbidden', redirectTo: resolved.forbiddenPath }
      }
    }

    if (route.permissions?.length && user) {
      if (!resolved.hasPermission(user, route.permissions)) {
        return { allowed: false, reason: 'forbidden', redirectTo: resolved.forbiddenPath }
      }
    }

    return { allowed: true }
  }

  return { check, options: resolved }
}
