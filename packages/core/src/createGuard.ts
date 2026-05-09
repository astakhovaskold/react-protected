import type { Guard, GuardOptions, RouteConfig, AccessResult } from './types'

// TODO: реализация
export function createGuard<TUser = unknown>(
  options: GuardOptions<TUser>
): Guard<TUser> {
  const resolved = {
    getUser:          options.getUser,
    isAuthenticated:  options.isAuthenticated  ?? ((user) => user !== null),
    hasRole:          options.hasRole          ?? (() => false),
    hasPermission:    options.hasPermission    ?? (() => false),
    loginPath:        options.loginPath        ?? '/login',
    forbiddenPath:    options.forbiddenPath    ?? '/403',
    defaultPath:      options.defaultPath      ?? '/',
    callbackUrlParam: options.callbackUrlParam ?? 'callbackUrl',
  } as Required<GuardOptions<TUser>>

  const check = (
    route: RouteConfig<TUser>,
    currentPath: string
  ): AccessResult => {
    const user          = resolved.getUser()
    const authenticated = resolved.isAuthenticated(user)
    const access        = route.access ?? 'public'

    // guest-only: редиректим залогиненных
    if (access === 'guest-only' && authenticated) {
      return { allowed: false, reason: 'guest-only', redirectTo: resolved.defaultPath }
    }

    // authenticated: редиректим незалогиненных
    if (access === 'authenticated' && !authenticated) {
      const redirectTo = `${resolved.loginPath}?${resolved.callbackUrlParam}=${currentPath}`
      return { allowed: false, reason: 'unauthenticated', redirectTo }
    }

    // RBAC: проверяем роли
    if (route.roles?.length && user) {
      if (!resolved.hasRole(user, route.roles)) {
        return { allowed: false, reason: 'forbidden', redirectTo: resolved.forbiddenPath }
      }
    }

    // ABAC: проверяем права
    if (route.permissions?.length && user) {
      if (!resolved.hasPermission(user, route.permissions)) {
        return { allowed: false, reason: 'forbidden', redirectTo: resolved.forbiddenPath }
      }
    }

    return { allowed: true }
  }

  return { check, options: resolved }
}
