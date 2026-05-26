import type { AccessConfig, Guard } from '@react-protected/core'
import { createGuard } from '@react-protected/core'
import {
  createBrowserRouter,
  redirect,
  type RouteObject,
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
    (resolved, ctx) => resolved ?? getGuardRedirect(ctx, currentPath),
    null
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
    if (redirectTo) return redirect(redirectTo) as TResult
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
  preserveStaticUi: boolean
): RouteObject['lazy'] | undefined {
  if (!lazy) return undefined

  const resolveRoute =
    typeof lazy === 'function' ? lazy : () => resolveLazyObject(lazy as LazyRouteLoader)

  return async () => {
    const resolvedRoute = (await resolveRoute()) as
      | {
          loader?: ProtectedRouteObject<TUser>['loader']
          action?: ProtectedRouteObject<TUser>['action']
          [key: string]: unknown
        }
      | undefined

    if (!resolvedRoute) return {}

    const { loader, action, element, Component, ...routeProps } = resolvedRoute

    return {
      ...routeProps,
      ...(preserveStaticUi ? {} : { element, Component }),
      loader: guardChain.length > 0
        ? wrapDataFunction(loader ?? (() => null), guardChain)
        : loader,
      action: wrapDataFunction(action, guardChain),
    }
  }
}

/**
 * Creates a browser router with access checks applied to protected routes.
 *
 * @typeParam TUser - User shape returned by `getUser`.
 * @param routes - Route objects extended with access protection fields.
 * @param options - Guard callbacks and navigation settings used by protected routes.
 * @param routerOptions - Extra options forwarded to `createBrowserRouter`.
 * @returns A React Router browser router with protected UI, loaders, actions, and lazy routes.
 */
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

      // For guarded lazy routes without a static loader, skip injecting a static loader
      // so React Router uses the lazy-resolved loader (which wrapLazyRoute guards).
      const guardedLoader = hasGuardConfig && (!lazy || loader !== undefined)
        ? wrapDataFunction(loader ?? (() => null), guardChain)
        : wrapDataFunction(loader, guardChain)

      return {
        ...routeProps,
        element,
        Component,
        loader: guardedLoader,
        action: wrapDataFunction(action, guardChain),
        lazy: wrapLazyRoute(
          lazy,
          guardChain,
          hasGuardConfig && ((element !== undefined && element !== null) || Component != null)
        ),
        children: children ? transform(children, guardChain) : undefined,
      } as RouteObject
    })

  return createBrowserRouter(transform(routes), routerOptions)
}
