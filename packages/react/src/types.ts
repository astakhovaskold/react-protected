import type { AccessConfig as CoreAccessConfig, Guard, GuardOptions } from '@react-protected/core'
import type { ReactNode } from 'react'

/**
 * Access requirements consumed by React hooks and components in this package.
 */
export type RouteProtection = CoreAccessConfig

/**
 * Access context exposed by `useAccess()`.
 */
export type AccessContextValue<TUser = unknown> = {
  /**
   * Guard instance used to evaluate access rules.
   */
  guard: Guard<TUser>
}

/**
 * Props accepted by `AccessProvider`.
 */
export type AccessProviderProps<TUser = unknown> = GuardOptions<TUser> & {
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
