import type { RouteObject } from 'react-router-dom'
import type { RouteAccess, GuardOptions } from '@react-protected/core'

type RouteProtection = {
  access?: RouteAccess
  roles?: string[]
  permissions?: string[]
  meta?: Record<string, unknown>
}

export type ProtectedRouteObject<TUser = unknown> =
  Omit<RouteObject, 'children'> &
  RouteProtection & {
    children?: ProtectedRouteObject<TUser>[]
  }

export type CreateRouterGuardOptions<TUser = unknown> = GuardOptions<TUser>
