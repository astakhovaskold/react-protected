import type { AccessConfig as CoreAccessConfig, Guard, GuardOptions } from '@react-protected/core'
import type { ReactNode } from 'react'

/**
 * Access requirements consumed by React hooks and components in this package.
 */
export type RouteProtection = CoreAccessConfig

/**
 * Navigation paths used when access-aware components need to redirect.
 */
export type NavigationConfig = {
  /**
   * Redirect target for unauthenticated users.
   */
  loginPath?: string
  /**
   * Redirect target when the user is authenticated but lacks access.
   */
  forbiddenPath?: string
  /**
   * Redirect target for authenticated users visiting guest-only screens.
   */
  defaultPath?: string
  /**
   * Query parameter name used to preserve the current location during login redirects.
   */
  callbackUrlParam?: string
  /**
   * Decides whether the callback URL should be attached to an unauthenticated redirect.
   */
  shouldAddCallbackUrl?: () => boolean
}

/**
 * Access context exposed by `useAccess()`.
 */
export type AccessContextValue<TUser = unknown> = {
  /**
   * Guard instance used to evaluate access rules.
   */
  guard: Guard<TUser>
  /**
   * Redirect target for unauthenticated users.
   */
  loginPath: string
  /**
   * Redirect target when the user is authenticated but forbidden.
   */
  forbiddenPath: string
  /**
   * Redirect target for authenticated users on guest-only screens.
   */
  defaultPath: string
  /**
   * Query parameter name used to preserve the current location during login redirects.
   */
  callbackUrlParam?: string
  /**
   * Decides whether the callback URL should be attached to an unauthenticated redirect.
   */
  shouldAddCallbackUrl?: () => boolean
}

/**
 * Props accepted by `AccessProvider`.
 */
export type AccessProviderProps<TUser = unknown> = GuardOptions<TUser> &
  NavigationConfig & {
    /**
     * React subtree that consumes the access context.
     */
    children?: ReactNode
  }

/**
 * Access requirements accepted by `useHasAccess()` and `HasAccess`.
 */
export type AccessRouteProps = RouteProtection & {
  /**
   * React subtree rendered when the access check passes.
   */
  children?: ReactNode
}
