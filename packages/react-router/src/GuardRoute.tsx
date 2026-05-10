import { Navigate, useLocation } from 'react-router-dom'

import { useGuard } from './GuardProvider'
import type { GuardRouteProps } from './types'

export function GuardRoute({
  access,
  roles,
  permissions,
  meta,
  children,
}: GuardRouteProps) {
  const guard = useGuard()
  const location = useLocation()
  const currentPath = `${location.pathname}${location.search}${location.hash}`
  const result = guard.check(
    {
      path: location.pathname,
      access,
      roles,
      permissions,
      meta,
    },
    currentPath
  )

  if (!result.allowed) {
    return <Navigate to={result.redirectTo} replace />
  }

  return children
}
