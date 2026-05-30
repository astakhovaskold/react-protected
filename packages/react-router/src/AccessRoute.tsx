import { useAccess } from '@react-protected/react'
import { memo } from 'react'
import { Outlet } from 'react-router-dom'

import type { AccessRouteProps, RouterRouteConfig } from './types'
import { resolveRouteAccess, type RouteAccessResult } from './utils/route-access'

/**
 * Evaluates route protection with the active access context.
 *
 * @param config - Access requirements to evaluate for the current route.
 * @returns The guard result for the provided route protection config.
 */
export function useRouteAccess(config: RouterRouteConfig): RouteAccessResult {
  const { guard } = useAccess()
  return resolveRouteAccess(guard, config)
}

/**
 * Protects a route element and renders a denied fallback when access is denied.
 *
 * @param props - Route protection rules and optional child content.
 * @returns The protected children, an `Outlet`, or denied fallback content.
 */
export const AccessRoute = memo(({
  access,
  roles,
  permissions,
  meta,
  children,
  renderDenied,
}: AccessRouteProps) => {
  const { guard } = useAccess()
  const result = resolveRouteAccess(guard, { access, roles, permissions, meta })

  if (!result.allowed) {
    return renderDenied?.(result) ?? null
  }

  return children ?? <Outlet />
})
