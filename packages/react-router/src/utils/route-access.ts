import type { AccessResult, Guard } from '@react-protected/core'

import type { RouterRouteConfig } from '../types'

export type RouteAccessResult = AccessResult

export type DeniedRouteAccessResult = Extract<RouteAccessResult, { allowed: false }>

export function resolveRouteAccess<TUser = unknown>(
  guard: Guard<TUser>,
  config: RouterRouteConfig
): RouteAccessResult {
  return guard.check(config)
}
