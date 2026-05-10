import type { AccessResult, Guard, GuardOptions, RouteConfig } from './types'

function buildLoginRedirect(
  loginPath: string,
  callbackUrlParam: string,
  currentPath: string
): string {
  const url = new URL(loginPath, 'https://react-protected.local')
  url.searchParams.set(callbackUrlParam, currentPath)
  return `${url.pathname}${url.search}${url.hash}`
}

export function createGuard<TUser = unknown>(options: GuardOptions<TUser>): Guard<TUser> {
  const resolved = {
    getUser: options.getUser,
    isAuthenticated: options.isAuthenticated ?? ((user) => user !== null),
    hasRole: options.hasRole ?? (() => false),
    hasPermission: options.hasPermission ?? (() => false),
    loginPath: options.loginPath ?? '/login',
    forbiddenPath: options.forbiddenPath ?? '/403',
    defaultPath: options.defaultPath ?? '/',
    callbackUrlParam: options.callbackUrlParam ?? 'callbackUrl',
  } as Required<GuardOptions<TUser>>

  const check = (route: RouteConfig, currentPath: string): AccessResult => {
    const user = resolved.getUser()
    const authenticated = resolved.isAuthenticated(user)
    const access = route.access ?? 'public'
    const requiresAuth =
      access === 'authenticated' ||
      Boolean(route.roles?.length) ||
      Boolean(route.permissions?.length)

    // guest-only: редиректим залогиненных
    if (access === 'guest-only' && authenticated) {
      return { allowed: false, reason: 'guest-only', redirectTo: resolved.defaultPath }
    }

    // authenticated / RBAC / ABAC: редиректим незалогиненных
    if (requiresAuth && !authenticated) {
      const redirectTo = buildLoginRedirect(
        resolved.loginPath,
        resolved.callbackUrlParam,
        currentPath
      )
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
