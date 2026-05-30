import { createGuard } from '@react-protected/core'
import { createContext, type ReactNode, useContext, useMemo } from 'react'

import type { AccessContextValue, AccessProviderProps } from './types'

const AccessContext = createContext<AccessContextValue | null>(null)

/**
 * Provides access control configuration to the React subtree.
 *
 * @typeParam TUser - User shape returned by `getUser`.
 * @param props - Guard callbacks, navigation settings, and descendant elements.
 * @returns A context provider that enables access-aware hooks and components.
 */
export function AccessProvider<TUser = unknown>({
  children,
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
    }),
    [guard]
  )

  return (
    <AccessContext.Provider value={value}>
      {children as ReactNode}
    </AccessContext.Provider>
  )
}

/**
 * Returns the active access context from `AccessProvider`.
 *
 * @typeParam TUser - User shape stored in the access context.
 * @returns The guard instance for the current subtree.
 * @throws {Error} When called outside an `AccessProvider`.
 */
export function useAccess<TUser = unknown>(): AccessContextValue<TUser> {
  const ctx = useContext(AccessContext)

  if (!ctx) {
    throw new Error('useAccess must be used within <AccessProvider>')
  }

  return ctx as AccessContextValue<TUser>
}
