export type AccessLevel = 'public' | 'authenticated'

export type AccessConfig = {
  access?: AccessLevel
  roles?: Array<string>
  permissions?: Array<string>
  meta?: Record<string, unknown>
}

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'unauthenticated' }
  | { allowed: false; reason: 'forbidden' }

export type GuardOptions<TUser = unknown> = {
  getUser: () => TUser | null
  isAuthenticated?: (user: TUser | null) => boolean
  hasRole?: (user: TUser, roles: Array<string>) => boolean
  hasPermission?: (user: TUser, permissions: Array<string>) => boolean
}

export type Guard<TUser = unknown> = {
  check: (config: AccessConfig) => AccessResult
  options: Required<GuardOptions<TUser>>
}
