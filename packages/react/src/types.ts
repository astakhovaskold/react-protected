import type { AccessConfig, Guard, GuardOptions } from '@react-protected/core'
import type { ReactNode } from 'react'

export type { AccessConfig as RouteProtection } from '@react-protected/core'

export type NavigationConfig = {
  loginPath?: string
  forbiddenPath?: string
  defaultPath?: string
  callbackUrlParam?: string
  shouldAddCallbackUrl?: () => boolean
}

export type AccessContextValue<TUser = unknown> = {
  guard: Guard<TUser>
  loginPath: string
  forbiddenPath: string
  defaultPath: string
  callbackUrlParam?: string
  shouldAddCallbackUrl?: () => boolean
}

export type AccessProviderProps<TUser = unknown> = GuardOptions<TUser> &
  NavigationConfig & {
    children?: ReactNode
  }

export type AccessRouteProps = AccessConfig & {
  children?: ReactNode
}
