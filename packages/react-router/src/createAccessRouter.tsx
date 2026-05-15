import type { AccessConfig, Guard } from '@react-protected/core'
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
  CreateAccessRouterConfig,
  CreateAccessRouterOptions,
  ProtectedRouteObject,
  RouterRouteConfig,
} from './types'

type RouterGuardContext<TUser> = {
  guard: Guard<TUser>
  protection: RouterRouteConfig
  hasStaticUi: boolean
  loginPath: string
  forbiddenPath: string
  defaultPath: string
  callbackUrlParam?: string
}

type GuardedElementProps<TUser> = RouterRouteConfig & {
  guard: Guard<TUser>
  routeElement?: ReactNode
  RouteComponent?: ComponentType | null
  loginPath: string
  forbiddenPath: string
  defaultPath: string
  callbackUrlParam?: string
}

type LazyRouteLoader = Record<string, (() => Promise<unknown>) | undefined>

function buildRedirect(
  reason: string,
  currentPath: string,
  loginPath: string,
  forbiddenPath: string,
  defaultPath: string,
  callbackUrlParam?: string
): string {
  if (reason === 'unauthenticated') {
    return callbackUrlParam
      ? `${loginPath}?${callbackUrlParam}=${encodeURIComponent(currentPath)}`
      : loginPath
  }
  if (reason === 'forbidden') return forbiddenPath
  return defaultPath
}

function GuardedElement<TUser>({
  access,
  roles,
  permissions,
  meta,
  guard,
  routeElement,
  RouteComponent,
  loginPath,
  forbiddenPath,
  defaultPath,
  callbackUrlParam,
}: GuardedElementProps<TUser>) {
  const location = useLocation()
  const currentPath = `${location.pathname}${location.search}${location.hash}`

  if (access === 'guest-only') {
    const user = guard.options.getUser()
    const isAuth = guard.options.isAuthenticated(user)
    if (isAuth) return <Navigate to={defaultPath} replace />
    if (RouteComponent) return <RouteComponent />
    if (routeElement !== undefined && routeElement !== null) return routeElement
    return <Outlet />
  }

  const result = guard.check({ access, roles, permissions, meta })

  if (!result.allowed) {
    const redirectTo = buildRedirect(
      result.reason,
      currentPath,
      loginPath,
      forbiddenPath,
      defaultPath,
      callbackUrlParam
    )
    return <Navigate to={redirectTo} replace />
  }

  if (RouteComponent) return <RouteComponent />
  if (routeElement !== undefined && routeElement !== null) return routeElement
  return <Outlet />
}

function wrapGuardedElement<TUser>(ctx: RouterGuardContext<TUser>, element?: ReactNode, Component?: ComponentType | null) {
  return (
    <GuardedElement
      {...ctx.protection}
      guard={ctx.guard}
      routeElement={element}
      RouteComponent={Component ?? null}
      loginPath={ctx.loginPath}
      forbiddenPath={ctx.forbiddenPath}
      defaultPath={ctx.defaultPath}
      callbackUrlParam={ctx.callbackUrlParam}
    />
  )
}

function wrapDataFunction<TUser, TArgs extends { request: Request }, TResult>(
  handler: ((args: TArgs) => TResult) | boolean | undefined,
  ctx: RouterGuardContext<TUser>
) {
  if (handler === undefined || typeof handler === 'boolean') return handler

  return ((args: TArgs) => {
    const url = new URL(args.request.url)
    const currentPath = `${url.pathname}${url.search}`

    if (ctx.protection.access === 'guest-only') {
      const user = ctx.guard.options.getUser()
      const isAuth = ctx.guard.options.isAuthenticated(user)
      if (isAuth) return redirect(ctx.defaultPath) as TResult
      return handler(args)
    }

    const result = ctx.guard.check(ctx.protection as AccessConfig)

    if (!result.allowed) {
      const redirectTo = buildRedirect(
        result.reason,
        currentPath,
        ctx.loginPath,
        ctx.forbiddenPath,
        ctx.defaultPath,
        ctx.callbackUrlParam
      )
      return redirect(redirectTo) as TResult
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
  ctx: RouterGuardContext<TUser>
): RouteObject['lazy'] | undefined {
  if (!lazy) return undefined

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
      return ctx.hasStaticUi ? {} : { element: wrapGuardedElement(ctx) }
    }

    const { element, Component, loader, action, ...routeProps } = resolvedRoute
    const wrappedRoute: Record<string, unknown> = {
      ...routeProps,
      loader: wrapDataFunction(loader, ctx),
      action: wrapDataFunction(action, ctx),
    }

    if (!ctx.hasStaticUi) {
      wrappedRoute.element = wrapGuardedElement(ctx, element, Component ?? null)
    }

    return wrappedRoute
  }
}

export function createAccessRouter<TUser = unknown>(
  routes: Array<ProtectedRouteObject<TUser>>,
  options: CreateAccessRouterConfig<TUser>,
  routerOptions?: CreateAccessRouterOptions
): ReturnType<typeof createBrowserRouter> {
  const {
    loginPath = '/login',
    forbiddenPath = '/403',
    defaultPath = '/',
    callbackUrlParam,
    ...guardOptions
  } = options

  const guard = createGuard(guardOptions)

  const transform = (inputRoutes: Array<ProtectedRouteObject<TUser>>): Array<RouteObject> =>
    inputRoutes.map((route) => {
      const {
        access, roles, permissions, meta,
        children, element, Component, loader, action, lazy,
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
          element, Component, loader, action, lazy,
          children: children ? transform(children) : undefined,
        } as RouteObject
      }

      const ctx: RouterGuardContext<TUser> = {
        guard,
        protection: { access, roles, permissions, meta },
        hasStaticUi: (element !== undefined && element !== null) || Component != null,
        loginPath,
        forbiddenPath,
        defaultPath,
        callbackUrlParam,
      }

      const guardedElement =
        ctx.hasStaticUi || !lazy
          ? wrapGuardedElement(ctx, element, Component ?? null)
          : undefined

      return {
        ...routeProps,
        element: guardedElement,
        Component: undefined,
        loader: wrapDataFunction(loader, ctx),
        action: wrapDataFunction(action, ctx),
        lazy: wrapLazyRoute(lazy, ctx),
        children: children ? transform(children) : undefined,
      } as RouteObject
    })

  return createBrowserRouter(transform(routes), routerOptions)
}
