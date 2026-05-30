/**
 * Access level handled by the framework-agnostic guard.
 */
export type AccessLevel = 'public' | 'authenticated' | 'unauthenticated'

/**
 * Access requirements consumed by `guard.check()` and adapter components.
 */
export type AccessConfig = {
  /**
   * Declares whether access is public, requires an authenticated user, or requires
   * an unauthenticated user.
   * Defaults to `'public'` when omitted.
   */
  access?: AccessLevel
  /**
   * Roles that must be satisfied by your `hasRole` callback.
   */
  roles?: Array<string>
  /**
   * Permissions that must be satisfied by your `hasPermission` callback.
   */
  permissions?: Array<string>
  /**
   * Optional metadata for application-specific access logic.
   */
  meta?: Record<string, unknown>
}

/**
 * Result returned by `guard.check()`.
 */
export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'unauthenticated' }
  | { allowed: false; reason: 'authenticated' }
  | { allowed: false; reason: 'forbidden' }

/**
 * Callbacks and accessors used to create a guard instance.
 */
export type GuardOptions<TUser = unknown> = {
  /**
   * Returns the current user or `null` when no user is available.
   */
  getUser: () => TUser | null
  /**
   * Overrides the default authenticated check of `user !== null`.
   */
  isAuthenticated?: (user: TUser | null) => boolean
  /**
   * Determines whether the current user satisfies the requested roles.
   */
  hasRole?: (user: TUser, roles: Array<string>) => boolean
  /**
   * Determines whether the current user satisfies the requested permissions.
   */
  hasPermission?: (user: TUser, permissions: Array<string>) => boolean
}

/**
 * Guard instance returned by `createGuard()`.
 */
export type Guard<TUser = unknown> = {
  /**
   * Evaluates whether the current user satisfies the provided access config.
   */
  check: (config: AccessConfig) => AccessResult
  /**
   * Resolved guard callbacks with built-in defaults applied.
   */
  options: Required<GuardOptions<TUser>>
}
