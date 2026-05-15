import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { useAccess } from './AccessProvider'
import type { RouteProtection } from './types'

type HasAccessProps = RouteProtection & {
  children?: ReactNode
}

export function useHasAccess({ access, roles, permissions, meta }: RouteProtection): boolean {
  const guard = useAccess()
  const location = useLocation()
  const currentPath = `${location.pathname}${location.search}${location.hash}`
  const result = guard.check(
    { path: location.pathname, access, roles, permissions, meta },
    currentPath
  )
  return result.allowed
}

export function HasAccess({ access, roles, permissions, meta, children }: HasAccessProps) {
  const allowed = useHasAccess({ access, roles, permissions, meta })
  return allowed ? <>{children}</> : null
}
