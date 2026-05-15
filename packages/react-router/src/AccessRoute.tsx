import { memo } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { useRouteAccess } from './HasAccess'
import type { AccessRouteProps } from './types'

export const AccessRoute = memo(function AccessRoute({
  access,
  roles,
  permissions,
  meta,
  children,
}: AccessRouteProps) {
  const result = useRouteAccess({ access, roles, permissions, meta })

  if (!result.allowed) {
    return <Navigate to={result.redirectTo} replace />
  }

  return children ?? <Outlet />
})
