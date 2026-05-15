import type { GuardOptions } from '@react-protected/core'
import type { NavigationConfig, RouteProtection } from '@react-protected/react'
import type { createBrowserRouter, RouteObject } from 'react-router-dom'

export type ProtectedRouteObject<TUser = unknown> = Omit<RouteObject, 'children'> &
  RouteProtection & {
    children?: Array<ProtectedRouteObject<TUser>>
  }

export type CreateAccessRouterOptions = Parameters<typeof createBrowserRouter>[1]

export type CreateAccessRouterConfig<TUser = unknown> = GuardOptions<TUser> & NavigationConfig
