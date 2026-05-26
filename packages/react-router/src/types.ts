import type { AccessLevel, GuardOptions } from '@react-protected/core'
import type { NavigationConfig, RouteProtection } from '@react-protected/react'
import type { ReactNode } from 'react'
import type { createBrowserRouter, RouteObject } from 'react-router-dom'

/**
 * Access level supported by the React Router adapter.
 */
export type RouterAccessLevel = AccessLevel | 'guest-only'

/**
 * Route protection config accepted by router-aware APIs.
 */
export type RouterRouteConfig = Omit<RouteProtection, 'access'> & {
  /**
   * Access level for the route, including support for guest-only screens.
   */
  access?: RouterAccessLevel
}

/**
 * Props accepted by `AccessRoute`.
 */
export type AccessRouteProps = RouterRouteConfig & {
  /**
   * Route element rendered when access is allowed.
   */
  children?: ReactNode
}

/**
 * React Router route object extended with access protection fields.
 */
export type ProtectedRouteObject<TUser = unknown> = Omit<RouteObject, 'children'> &
  RouterRouteConfig & {
    /**
     * Nested child routes that inherit parent guard behavior.
     */
    children?: Array<ProtectedRouteObject<TUser>>
  }

/**
 * Additional options forwarded to `createBrowserRouter`.
 */
export type CreateAccessRouterOptions = Parameters<typeof createBrowserRouter>[1]

/**
 * Guard callbacks and navigation settings accepted by `createAccessRouter`.
 */
export type CreateAccessRouterConfig<TUser = unknown> = GuardOptions<TUser> & NavigationConfig
