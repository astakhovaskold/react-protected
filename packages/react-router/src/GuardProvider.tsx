import { createGuard } from '@react-protected/core'
import { createContext, type ReactNode, useContext } from 'react'

import type { GuardContextValue, GuardProviderProps } from './types'

const GuardContext = createContext<GuardContextValue | null>(null)

export function GuardProvider<TUser = unknown>({
  children,
  ...options
}: GuardProviderProps<TUser>) {
  const guard = createGuard(options)

  return (
    <GuardContext.Provider value={guard as GuardContextValue}>
      {children as ReactNode}
    </GuardContext.Provider>
  )
}

export function useGuard<TUser = unknown>() {
  const guard = useContext(GuardContext)

  if (!guard) {
    throw new Error('useGuard must be used within <GuardProvider>')
  }

  return guard as GuardContextValue<TUser>
}
