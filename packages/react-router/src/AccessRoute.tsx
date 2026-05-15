import { useAccess } from '@react-protected/react'
import type { AccessResult } from '@react-protected/core'
import type { RouteProtection } from '@react-protected/react'
import { memo } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import type { AccessRouteProps } from './types'

export function useRouteAccess(config: RouteProtection): AccessResult {
  const { guard } = useAccess()
  return guard.check(config)
}

export const AccessRoute = memo(function AccessRoute({
  access,
  roles,
  permissions,
  meta,
  children,
}: AccessRouteProps) {
  const { guard, loginPath, forbiddenPath, defaultPath, callbackUrlParam } = useAccess()
  const location = useLocation()

  if (access === 'guest-only') {
    const user = guard.options.getUser()
    const isAuth = guard.options.isAuthenticated(user)
    if (isAuth) return <Navigate to={defaultPath} replace />
    return <>{children ?? <Outlet />}</>
  }

  const result = guard.check({ access, roles, permissions, meta })

  if (!result.allowed) {
    if (result.reason === 'unauthenticated') {
      const currentPath = `${location.pathname}${location.search}${location.hash}`
      const redirectTo = callbackUrlParam
        ? `${loginPath}?${callbackUrlParam}=${encodeURIComponent(currentPath)}`
        : loginPath
      return <Navigate to={redirectTo} replace />
    }

    return <Navigate to={forbiddenPath} replace />
  }

  return <>{children ?? <Outlet />}</>
})
