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
  | { allowed: false; reason: 'unauthenticated' }
  | { allowed: false; reason: 'forbidden' }
  | { allowed: false; reason: 'guest-only' }

export type GuardOptions<TUser = unknown> = {
  getUser: () => TUser | null
  isAuthenticated?: (user: TUser | null) => boolean
  hasRole?: (user: TUser, roles: Array<string>) => boolean
  hasPermission?: (user: TUser, permissions: Array<string>) => boolean
}

export type Guard<TUser = unknown> = {
  check: (route: RouteConfig) => AccessResult
  options: Required<GuardOptions<TUser>>
}
