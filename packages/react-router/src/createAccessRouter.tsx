import type { Guard } from '@react-protected/core'
import { createGuard } from '@react-protected/core'
import type { ComponentType, ReactNode } from 'react'
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  redirect,
  type RouteObject,
  useLocation,
} from 'react-router-dom'

import type {
  CreateAccessRouterOptions,
  CreateRouterGuardOptions,
  ProtectedRouteObject,
  RouteProtection,
} from './types'

type GuardedElementProps<TUser> = RouteProtection & {
  guard: Guard<TUser>
  routeElement?: ReactNode
  RouteComponent?: ComponentType | null
}

type LazyRouteLoader = Record<string, (() => Promise<unknown>) | undefined>

type GuardContext<TUser> = {
  guard: Guard<TUser>
  protection: RouteProtection
  hasStaticUi: boolean
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
  const result = guard.check({
    path: location.pathname,
    access,
    roles,
    permissions,
    meta,
  })

  if (!result.allowed) {
    return <Navigate to={result.redirectTo} replace />
  }

  if (RouteComponent) {
    return <RouteComponent />
  }

  if (routeElement !== undefined && routeElement !== null) {
    return routeElement
  }

  return <Outlet />
}

function wrapGuardedElement<TUser>(
  context: GuardContext<TUser>,
  routeElement: ReactNode | undefined,
  RouteComponent: ComponentType | null | undefined
) {
  return (
    <GuardedElement
      access={context.protection.access}
      roles={context.protection.roles}
      permissions={context.protection.permissions}
      meta={context.protection.meta}
      guard={context.guard}
      routeElement={routeElement}
      RouteComponent={RouteComponent ?? null}
    />
  )
}

function wrapDataFunction<TUser, TArgs extends { request: Request }, TResult>(
  handler: ((args: TArgs) => TResult) | boolean | undefined,
  context: GuardContext<TUser>
) {
  if (handler === undefined || typeof handler === 'boolean') {
    return handler
  }

  return ((args: TArgs) => {
    const { pathname } = new URL(args.request.url)
    const result = context.guard.check({ path: pathname, ...context.protection })

    if (!result.allowed) {
      return redirect(result.redirectTo) as TResult
    }

    return handler(args)
  }) as typeof handler
}

async function resolveLazyObject(lazyObject: LazyRouteLoader) {
  const entries = await Promise.all(
    Object.entries(lazyObject).map(async ([key, load]) => [key, await load?.()] as const)
  )

  return Object.fromEntries(entries)
}

function wrapLazyRoute<TUser>(
  lazy: ProtectedRouteObject<TUser>['lazy'],
  context: GuardContext<TUser>
): RouteObject['lazy'] | undefined {
  if (!lazy) {
    return undefined
  }

  const resolveRoute =
    typeof lazy === 'function' ? lazy : () => resolveLazyObject(lazy as LazyRouteLoader)

  return async () => {
    const resolvedRoute = (await resolveRoute()) as
      | {
          element?: ReactNode
          Component?: ComponentType | null
          loader?: ProtectedRouteObject<TUser>['loader']
          action?: ProtectedRouteObject<TUser>['action']
          [key: string]: unknown
        }
      | undefined

    if (!resolvedRoute) {
      return context.hasStaticUi
        ? {}
        : { element: wrapGuardedElement(context, undefined, null) }
    }

    const { element, Component, loader, action, ...routeProps } = resolvedRoute

    const wrappedRoute: Record<string, unknown> = {
      ...routeProps,
      loader: wrapDataFunction(loader, context),
      action: wrapDataFunction(action, context),
    }

    if (!context.hasStaticUi) {
      wrappedRoute.element = wrapGuardedElement(context, element, Component ?? null)
    }

    return wrappedRoute
  }
}

export function createAccessRouter<TUser = unknown>(
  routes: Array<ProtectedRouteObject<TUser>>,
  options: CreateRouterGuardOptions<TUser>,
  routerOptions?: CreateAccessRouterOptions
): ReturnType<typeof createBrowserRouter> {
  const guard = createGuard(options)

  const transform = (
    inputRoutes: Array<ProtectedRouteObject<TUser>>
  ): Array<RouteObject> =>
    inputRoutes.map((route) => {
      const {
        access,
        roles,
        permissions,
        meta,
        children,
        element,
        Component,
        loader,
        action,
        lazy,
        ...routeProps
      } = route
      const hasGuardConfig =
        access !== undefined ||
        Boolean(roles?.length) ||
        Boolean(permissions?.length) ||
        meta !== undefined

      if (!hasGuardConfig) {
        return {
          ...routeProps,
          element,
          Component,
          loader,
          action,
          lazy,
          children: children ? transform(children) : undefined,
        } as RouteObject
      }

      const context: GuardContext<TUser> = {
        guard,
        protection: { access, roles, permissions, meta },
        hasStaticUi: (element !== undefined && element !== null) || Component != null,
      }
      const guardedElement =
        context.hasStaticUi || !lazy
          ? wrapGuardedElement(context, element, Component ?? null)
          : undefined

      return {
        ...routeProps,
        element: guardedElement,
        Component: undefined,
        loader: wrapDataFunction(loader, context),
        action: wrapDataFunction(action, context),
        lazy: wrapLazyRoute(lazy, context),
        children: children ? transform(children) : undefined,
      } as RouteObject
    })

  return createBrowserRouter(transform(routes), routerOptions)
}
