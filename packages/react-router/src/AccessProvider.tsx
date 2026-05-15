import { createGuard } from '@react-protected/core'
import { createContext, type ReactNode, useContext } from 'react'

import type { AccessContextValue, AccessProviderProps } from './types'

const AccessContext = createContext<AccessContextValue | null>(null)

export function AccessProvider<TUser = unknown>({
  children,
  ...options
}: AccessProviderProps<TUser>) {
  const guard = createGuard(options)

  return (
    <AccessContext.Provider value={guard as AccessContextValue}>
      {children as ReactNode}
    </AccessContext.Provider>
  )
}

export function useAccess<TUser = unknown>() {
  const guard = useContext(AccessContext)

  if (!guard) {
    throw new Error('useAccess must be used within <AccessProvider>')
  }

  return guard as AccessContextValue<TUser>
}
