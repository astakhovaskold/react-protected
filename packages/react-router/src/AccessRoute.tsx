import { useAccess, useRouteAccess } from '@react-protected/react'
import type { AccessRouteProps } from '@react-protected/react'
import { memo } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export const AccessRoute = memo(function AccessRoute({
  access,
  roles,
  permissions,
  meta,
  children,
}: AccessRouteProps) {
  const result = useRouteAccess({ access, roles, permissions, meta })
  const { loginPath, forbiddenPath, defaultPath, callbackUrlParam } = useAccess()
  const location = useLocation()

  if (!result.allowed) {
    if (result.reason === 'unauthenticated') {
      const currentPath = `${location.pathname}${location.search}${location.hash}`
      const redirectTo = callbackUrlParam
        ? `${loginPath}?${callbackUrlParam}=${encodeURIComponent(currentPath)}`
        : loginPath
      return <Navigate to={redirectTo} replace />
    }

    if (result.reason === 'forbidden') {
      return <Navigate to={forbiddenPath} replace />
    }

    return <Navigate to={defaultPath} replace />
  }

  return children ?? <Outlet />
})
