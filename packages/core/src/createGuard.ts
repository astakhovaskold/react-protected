import type { AccessConfig, AccessResult, Guard, GuardOptions } from './types'

/**
 * Creates a guard that evaluates access against the current user.
 *
 * @typeParam TUser - User shape returned by `getUser`.
 * @param options - Access callbacks and user accessors used by the guard.
 * @returns A reusable guard with resolved defaults for authentication, role, and permission checks.
 * @remarks When `roles` or `permissions` are provided without `access`, the guard treats the config
 * as authenticated-only.
 */
export function createGuard<TUser = unknown>(options: GuardOptions<TUser>): Guard<TUser> {
  const resolved = {
    getUser: options.getUser,
    isAuthenticated: options.isAuthenticated ?? ((user) => user !== null),
    hasRole: options.hasRole ?? (() => false),
    hasPermission: options.hasPermission ?? (() => false),
  } as Required<GuardOptions<TUser>>

  const check = (config: AccessConfig): AccessResult => {
    const user = resolved.getUser()
    const authenticated = resolved.isAuthenticated(user)
    const access = config.access ?? 'public'
    const requiresAuth =
      access === 'authenticated' ||
      Boolean(config.roles?.length) ||
      Boolean(config.permissions?.length)

    if (access === 'unauthenticated') {
      return authenticated
        ? { allowed: false, reason: 'authenticated' }
        : { allowed: true }
    }

    if (requiresAuth && !authenticated) {
      return { allowed: false, reason: 'unauthenticated' }
    }

    if (config.roles?.length && user) {
      if (!resolved.hasRole(user, config.roles)) {
        return { allowed: false, reason: 'forbidden' }
      }
    }

    if (config.permissions?.length && user) {
      if (!resolved.hasPermission(user, config.permissions)) {
        return { allowed: false, reason: 'forbidden' }
      }
    }

    return { allowed: true }
  }

  return { check, options: resolved }
}
