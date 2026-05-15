import type { AccessResult } from '@react-protected/core'
import type { ReactNode } from 'react'

import { useAccess } from './AccessProvider'
import type { RouteProtection } from './types'

type HasAccessProps = RouteProtection & {
  children?: ReactNode
}

export function useHasAccess(config: RouteProtection): boolean {
  const guard = useAccess()
  return guard.check(config).allowed
}

export function useRouteAccess(config: RouteProtection): AccessResult {
  const guard = useAccess()
  return guard.check(config)
}

export function HasAccess({ access, roles, permissions, meta, children }: HasAccessProps) {
  const allowed = useHasAccess({ access, roles, permissions, meta })
  return allowed ? <>{children}</> : null
}
