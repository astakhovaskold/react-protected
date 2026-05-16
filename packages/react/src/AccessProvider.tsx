import { createGuard } from '@react-protected/core'
import { createContext, type ReactNode, useContext, useMemo } from 'react'

import type { AccessContextValue, AccessProviderProps } from './types'

const AccessContext = createContext<AccessContextValue | null>(null)

export function AccessProvider<TUser = unknown>({
  children,
  loginPath = '/login',
  forbiddenPath = '/403',
  defaultPath = '/',
  callbackUrlParam,
  getUser,
  isAuthenticated,
  hasRole,
  hasPermission,
}: AccessProviderProps<TUser>) {
  const guard = useMemo(
    () => createGuard({ getUser, isAuthenticated, hasRole, hasPermission }),
    [getUser, isAuthenticated, hasRole, hasPermission]
  )

  const value = useMemo<AccessContextValue>(
    () => ({
      guard: guard as AccessContextValue['guard'],
      loginPath,
      forbiddenPath,
      defaultPath,
      callbackUrlParam,
    }),
    [guard, loginPath, forbiddenPath, defaultPath, callbackUrlParam]
  )

  return (
    <AccessContext.Provider value={value}>
      {children as ReactNode}
    </AccessContext.Provider>
  )
}

export function useAccess<TUser = unknown>(): AccessContextValue<TUser> {
  const ctx = useContext(AccessContext)

  if (!ctx) {
    throw new Error('useAccess must be used within <AccessProvider>')
  }

  return ctx as AccessContextValue<TUser>
}
