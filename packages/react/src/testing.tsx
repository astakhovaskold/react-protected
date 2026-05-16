import type { GuardOptions } from '@react-protected/core'
import type { ReactNode } from 'react'

import { AccessProvider } from './AccessProvider'
import type { NavigationConfig } from './types'

export type MockAccessProviderProps<TUser = unknown> = Partial<GuardOptions<TUser>> &
  NavigationConfig & {
    user?: TUser | null
    allowed?: boolean
    children?: ReactNode
  }

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
