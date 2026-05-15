import type { Guard, GuardOptions, RouteAccess } from '@react-protected/core'
import type { ReactNode } from 'react'

export type RouteProtection = {
  access?: RouteAccess
  roles?: Array<string>
  permissions?: Array<string>
  meta?: Record<string, unknown>
}

export type NavigationConfig = {
  loginPath?: string
  forbiddenPath?: string
  defaultPath?: string
  callbackUrlParam?: string
}

export type AccessContextValue<TUser = unknown> = {
  guard: Guard<TUser>
  loginPath: string
  forbiddenPath: string
  defaultPath: string
  callbackUrlParam?: string
}

export type AccessProviderProps<TUser = unknown> = GuardOptions<TUser> &
  NavigationConfig & {
    children?: ReactNode
  }

export type AccessRouteProps = RouteProtection & {
  children?: ReactNode
}
