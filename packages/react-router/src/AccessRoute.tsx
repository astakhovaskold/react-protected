import { Navigate, useLocation } from 'react-router-dom'

import { useAccess } from './AccessProvider'
import type { AccessRouteProps } from './types'

export function AccessRoute({
  access,
  roles,
  permissions,
  meta,
  children,
}: AccessRouteProps) {
  const guard = useAccess()
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
