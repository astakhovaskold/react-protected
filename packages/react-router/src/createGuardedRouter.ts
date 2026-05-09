import type { RouteObject } from 'react-router-dom'
import { createGuard } from '@react-protected/core'
import type { ProtectedRouteObject, CreateRouterGuardOptions } from './types'

// TODO: реализация
export function createGuardedRouter<TUser = unknown>(
  routes: ProtectedRouteObject<TUser>[],
  options: CreateRouterGuardOptions<TUser>
): RouteObject[] {
  const guard = createGuard(options)

  // Рекурсивно трансформируем маршруты
  const transform = (routes: ProtectedRouteObject<TUser>[]): RouteObject[] =>
    routes.map(({ access, roles, permissions, meta, children, index, ...routeProps }) => {
      if (index === true) {
        return {
          ...routeProps,
          index: true,
        } satisfies RouteObject
      }

      return {
        ...routeProps,
        ...(index === false ? { index: false } : {}),
        // TODO: обернуть element в GuardWrapper который вызывает guard.check()
        // и делает <Navigate> если нужен редирект
        children: children ? transform(children) : undefined,
      } satisfies RouteObject
    })

  return transform(routes)
}
