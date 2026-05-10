import type { Guard, GuardOptions, RouteAccess } from '@react-protected/core'
import type { ReactNode } from 'react'
import type { createBrowserRouter, RouteObject } from 'react-router-dom'

export type RouteProtection = {
  access?: RouteAccess
  roles?: Array<string>
  permissions?: Array<string>
  meta?: Record<string, unknown>
}

export type ProtectedRouteObject<TUser = unknown> = Omit<RouteObject, 'children'> &
  RouteProtection & {
    children?: Array<ProtectedRouteObject<TUser>>
  }

export type CreateRouterGuardOptions<TUser = unknown> = GuardOptions<TUser>

export type CreateGuardedRouterOptions = Parameters<typeof createBrowserRouter>[1]

export type GuardProviderProps<TUser = unknown> = GuardOptions<TUser> & {
  children?: ReactNode
}

export type GuardRouteProps = RouteProtection & {
  children?: ReactNode
}

export type GuardContextValue<TUser = unknown> = Guard<TUser>
