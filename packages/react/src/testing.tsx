import type { GuardOptions } from '@react-protected/core'
import type { ReactNode } from 'react'

import { AccessProvider } from './AccessProvider'
import type { NavigationConfig } from './types'

/**
 * Props accepted by `MockAccessProvider`.
 */
export type MockAccessProviderProps<TUser = unknown> = Partial<GuardOptions<TUser>> &
  NavigationConfig & {
    /**
     * User returned by the default `getUser` implementation.
     */
    user?: TUser | null
    /**
     * Default outcome used by generated access callbacks when explicit callbacks are not provided.
     */
    allowed?: boolean
    /**
     * React subtree that consumes the mocked access context.
     */
    children?: ReactNode
  }

/**
 * Test helper that provides a predictable access context.
 *
 * @typeParam TUser - User shape returned by the mocked `getUser`.
 * @param props - Mocked user, optional callback overrides, navigation settings, and children.
 * @returns An `AccessProvider` configured for deterministic tests.
 * @remarks When explicit callbacks are omitted, authentication, role, and permission checks all
 * resolve to the `allowed` flag.
 */
export function MockAccessProvider<TUser = unknown>({
  user = null,
  allowed = true,
  children,
  getUser,
  isAuthenticated,
  hasRole,
  hasPermission,
  loginPath,
  forbiddenPath,
  defaultPath,
  callbackUrlParam,
  shouldAddCallbackUrl,
}: MockAccessProviderProps<TUser>) {
  return (
    <AccessProvider
      getUser={getUser ?? (() => user)}
      isAuthenticated={isAuthenticated ?? (() => allowed)}
      hasRole={hasRole ?? (() => allowed)}
      hasPermission={hasPermission ?? (() => allowed)}
      loginPath={loginPath}
      forbiddenPath={forbiddenPath}
      defaultPath={defaultPath}
      callbackUrlParam={callbackUrlParam}
      shouldAddCallbackUrl={shouldAddCallbackUrl}
    >
      {children}
    </AccessProvider>
  )
}
