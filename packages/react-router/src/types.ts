import type { AccessLevel, GuardOptions } from '@react-protected/core'
import type { NavigationConfig, RouteProtection } from '@react-protected/react'
import type { ReactNode } from 'react'
import type { createBrowserRouter, RouteObject } from 'react-router-dom'

export type RouterAccessLevel = AccessLevel | 'guest-only'

export type RouterRouteConfig = Omit<RouteProtection, 'access'> & {
  access?: RouterAccessLevel
}

export type AccessRouteProps = RouterRouteConfig & {
  children?: ReactNode
}

export type ProtectedRouteObject<TUser = unknown> = Omit<RouteObject, 'children'> &
  RouterRouteConfig & {
    children?: Array<ProtectedRouteObject<TUser>>
  }

export type CreateAccessRouterOptions = Parameters<typeof createBrowserRouter>[1]

export type CreateAccessRouterConfig<TUser = unknown> = GuardOptions<TUser> & NavigationConfig
