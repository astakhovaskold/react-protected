import type { AccessLevel, AccessResult, GuardOptions } from '@react-protected/core'
import type { RouteProtection } from '@react-protected/react'
import type { ReactNode } from 'react'
import type { Params } from 'react-router-dom'

/**
 * Access level supported by the React Router adapter.
 */
export type RouterAccessLevel = AccessLevel

/**
 * Route protection config accepted by router-aware APIs.
 */
export type RouterRouteConfig = RouteProtection

/**
 * Props accepted by `AccessRoute`.
 */
export type AccessRouteProps = RouterRouteConfig & {
  /**
   * Route element rendered when access is allowed.
   */
  children?: ReactNode
  /**
   * Rendered when access is denied.
   */
  renderDenied?: (result: Extract<AccessResult, { allowed: false }>) => ReactNode
}

/**
 * Arguments passed to an `onDenied` callback.
 */
export type AccessDeniedArgs<TContext = unknown> = {
  /**
   * Access result that caused the denial.
   */
  result: Extract<AccessResult, { allowed: false }>
  /**
   * Original request handled by the route helper.
   */
  request: Request
  /**
   * Route params from the matched route.
   */
  params: Params<string>
  /**
   * Route context received from React Router.
   */
  context: TContext
  /**
   * Route config evaluated for this access check.
   */
  config: RouterRouteConfig
}

/**
 * Guard callbacks and denied handling accepted by middleware/loader/action helpers.
 */
export type CreateAccessHelpersConfig<TUser = unknown, TContext = unknown, TResult = unknown> =
  GuardOptions<TUser> & {
    /**
     * Called when access is denied.
     */
    onDenied: (args: AccessDeniedArgs<TContext>) => TResult
  }
