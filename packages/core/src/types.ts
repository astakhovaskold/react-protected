export type RouteAccess = 'public' | 'authenticated' | 'guest-only'

export type RouteConfig = {
  path?: string
  access?: RouteAccess
  roles?: Array<string>
  permissions?: Array<string>
  meta?: Record<string, unknown>
}

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'unauthenticated'; redirectTo: string }
  | { allowed: false; reason: 'forbidden'; redirectTo: string }
  | { allowed: false; reason: 'guest-only'; redirectTo: string }

export type GuardOptions<TUser = unknown> = {
  getUser: () => TUser | null
  isAuthenticated?: (user: TUser | null) => boolean
  hasRole?: (user: TUser, roles: Array<string>) => boolean
  hasPermission?: (user: TUser, permissions: Array<string>) => boolean
  loginPath?: string
  forbiddenPath?: string
  defaultPath?: string
}

export type Guard<TUser = unknown> = {
  check: (route: RouteConfig) => AccessResult
  options: Required<GuardOptions<TUser>>
}
