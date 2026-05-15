import type { Guard, GuardOptions, RouteConfig } from '@react-protected/core'
import type { ReactNode } from 'react'

export type { RouteConfig as RouteProtection } from '@react-protected/core'

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

export type AccessRouteProps = RouteConfig & {
  children?: ReactNode
}
