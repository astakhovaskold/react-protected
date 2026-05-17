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
  shouldAddCallbackUrl?: () => boolean
}

type GuardedElementProps<TUser> = RouterRouteConfig & {
  guard: Guard<TUser>
  routeElement?: ReactNode
  RouteComponent?: ComponentType | null
  loginPath: string
  forbiddenPath: string
  defaultPath: string
  callbackUrlParam?: string
  shouldAddCallbackUrl?: () => boolean
}

type LazyRouteLoader = Record<string, (() => Promise<unknown>) | undefined>

function buildRedirect(
  reason: string,
  currentPath: string,
  loginPath: string,
  forbiddenPath: string,
  defaultPath: string,
  callbackUrlParam?: string,
  shouldAddCallbackUrl?: () => boolean
): string {
  if (reason === 'unauthenticated') {
    const addCallback = callbackUrlParam && (shouldAddCallbackUrl?.() ?? true)
    return addCallback
      ? `${loginPath}?${callbackUrlParam}=${encodeURIComponent(currentPath)}`
      : loginPath
  }
  if (reason === 'forbidden') return forbiddenPath
  return defaultPath
}

function getGuardRedirect<TUser>(
  ctx: RouterGuardContext<TUser>,
  currentPath: string
): string | null {
  if (ctx.protection.access === 'guest-only') {
    const user = ctx.guard.options.getUser()
    const isAuth = ctx.guard.options.isAuthenticated(user)

    return isAuth ? ctx.defaultPath : null
  }

  const result = ctx.guard.check(ctx.protection as AccessConfig)

  if (!result.allowed) {
    return buildRedirect(
      result.reason,
      currentPath,
      ctx.loginPath,
      ctx.forbiddenPath,
      ctx.defaultPath,
      ctx.callbackUrlParam,
      ctx.shouldAddCallbackUrl
    )
  }

  return null
}

function getFirstGuardRedirect<TUser>(
  contexts: Array<RouterGuardContext<TUser>>,
  currentPath: string
): string | null {
  return contexts.reduce<string | null>(
    (resolvedRedirect, ctx) => resolvedRedirect ?? getGuardRedirect(ctx, currentPath),
    null
  )
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
  shouldAddCallbackUrl,
}: GuardedElementProps<TUser>) {
  const location = useLocation()
  const currentPath = `${location.pathname}${location.search}${location.hash}`
  const redirectTo = getGuardRedirect(
    {
      guard,
      protection: { access, roles, permissions, meta },
      hasStaticUi: Boolean(RouteComponent) || (routeElement !== undefined && routeElement !== null),
      loginPath,
      forbiddenPath,
      defaultPath,
      callbackUrlParam,
      shouldAddCallbackUrl,
    },
    currentPath
  )

  if (redirectTo) return <Navigate to={redirectTo} replace />

  if (RouteComponent) return <RouteComponent />
  if (routeElement !== undefined && routeElement !== null) return routeElement
  return <Outlet />
}

function wrapGuardedElement<TUser>(ctx: RouterGuardContext<TUser>, element?: ReactNode, Component?: ComponentType | null) {
  return (
    <GuardedElement
      access={ctx.protection.access}
      roles={ctx.protection.roles}
      permissions={ctx.protection.permissions}
      meta={ctx.protection.meta}
      guard={ctx.guard}
      routeElement={element}
      RouteComponent={Component ?? null}
      loginPath={ctx.loginPath}
      forbiddenPath={ctx.forbiddenPath}
      defaultPath={ctx.defaultPath}
      callbackUrlParam={ctx.callbackUrlParam}
      shouldAddCallbackUrl={ctx.shouldAddCallbackUrl}
    />
  )
}

function wrapDataFunction<TUser, TArgs extends { request: Request }, TResult>(
  handler: ((args: TArgs) => TResult) | boolean | undefined,
  guardChain: Array<RouterGuardContext<TUser>>
) {
  if (handler === undefined || typeof handler === 'boolean' || guardChain.length === 0) {
    return handler
  }

  return ((args: TArgs) => {
    const url = new URL(args.request.url)
    const currentPath = `${url.pathname}${url.search}`

    const redirectTo = getFirstGuardRedirect(guardChain, currentPath)

    if (redirectTo) {
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
  guardChain: Array<RouterGuardContext<TUser>>,
  ctx?: RouterGuardContext<TUser>
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
      if (!ctx) return {}
      return ctx.hasStaticUi ? {} : { element: wrapGuardedElement(ctx) }
    }

    const { element, Component, loader, action, ...routeProps } = resolvedRoute
    const wrappedRoute: Record<string, unknown> = {
      ...routeProps,
      loader: wrapDataFunction(loader, guardChain),
      action: wrapDataFunction(action, guardChain),
    }

    if (!ctx) {
      wrappedRoute.element = element
      wrappedRoute.Component = Component
      return wrappedRoute
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
    shouldAddCallbackUrl,
    ...guardOptions
  } = options

  const guard = createGuard(guardOptions)

  const transform = (
    inputRoutes: Array<ProtectedRouteObject<TUser>>,
    inheritedGuardChain: Array<RouterGuardContext<TUser>> = []
  ): Array<RouteObject> =>
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

      const ownGuardContext = hasGuardConfig
        ? {
            guard,
            protection: { access, roles, permissions, meta },
            hasStaticUi: (element !== undefined && element !== null) || Component != null,
            loginPath,
            forbiddenPath,
            defaultPath,
            callbackUrlParam,
            shouldAddCallbackUrl,
          }
        : undefined

      const guardChain = ownGuardContext
        ? [...inheritedGuardChain, ownGuardContext]
        : inheritedGuardChain

      if (!hasGuardConfig) {
        return {
          ...routeProps,
          element,
          Component,
          loader: wrapDataFunction(loader, guardChain),
          action: wrapDataFunction(action, guardChain),
          lazy: wrapLazyRoute(lazy, guardChain),
          children: children ? transform(children, guardChain) : undefined,
        } as RouteObject
      }

      if (!ownGuardContext) {
        throw new Error('Guard context must exist for guarded routes')
      }

      const guardedElement =
        ownGuardContext.hasStaticUi || !lazy
          ? wrapGuardedElement(ownGuardContext, element, Component ?? null)
          : undefined

      return {
        ...routeProps,
        element: guardedElement,
        Component: undefined,
        loader: wrapDataFunction(loader, guardChain),
        action: wrapDataFunction(action, guardChain),
        lazy: wrapLazyRoute(lazy, guardChain, ownGuardContext),
        children: children ? transform(children, guardChain) : undefined,
      } as RouteObject
    })

  return createBrowserRouter(transform(routes), routerOptions)
}
