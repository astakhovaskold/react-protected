import type { ReactNode, ComponentType } from 'react'
import { Navigate, Outlet, createBrowserRouter, useLocation } from 'react-router-dom'
import { createGuard } from '@react-protected/core'
import type { ProtectedRouteObject, CreateRouterGuardOptions } from './types'

type GuardedElementProps<TUser> = {
  access: ProtectedRouteObject<TUser>['access']
  roles: ProtectedRouteObject<TUser>['roles']
  permissions: ProtectedRouteObject<TUser>['permissions']
  meta: ProtectedRouteObject<TUser>['meta']
  guard: ReturnType<typeof createGuard<TUser>>
  routeElement?: ReactNode
  RouteComponent?: ComponentType | null
}

function GuardedElement<TUser>({
  access,
  roles,
  permissions,
  meta,
  guard,
  routeElement,
  RouteComponent,
}: GuardedElementProps<TUser>) {
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

  if (routeElement !== undefined) {
    return <>{routeElement}</>
  }

  if (RouteComponent) {
    return <RouteComponent />
  }

  return <Outlet />
}

export function createGuardedRouter<TUser = unknown>(
  routes: ProtectedRouteObject<TUser>[],
  options: CreateRouterGuardOptions<TUser>
): ReturnType<typeof createBrowserRouter> {
  const guard = createGuard(options)

  const transform = (
    inputRoutes: ProtectedRouteObject<TUser>[]
  ): ProtectedRouteObject<TUser>[] =>
    inputRoutes.map((route) => {
      const {
        access,
        roles,
        permissions,
        meta,
        children,
        element,
        Component,
        ...routeProps
      } = route
      const hasGuardConfig =
        access !== undefined ||
        Boolean(roles?.length) ||
        Boolean(permissions?.length) ||
        meta !== undefined

      return {
        ...routeProps,
        element: hasGuardConfig ? (
          <GuardedElement
            access={access}
            roles={roles}
            permissions={permissions}
            meta={meta}
            guard={guard}
            routeElement={element}
            RouteComponent={Component ?? null}
          />
        ) : element,
        Component: hasGuardConfig ? undefined : Component,
        children: children ? transform(children) : undefined,
      }
    })

  return createBrowserRouter(transform(routes))
}
