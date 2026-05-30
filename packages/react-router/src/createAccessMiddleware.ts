import { createGuard } from '@react-protected/core'
import type { MiddlewareFunction } from 'react-router-dom'

import type { CreateAccessHelpersConfig, RouterRouteConfig } from './types'
import { resolveRouteAccess } from './utils/route-access'

/**
 * Creates a React Router middleware factory for guarded routes.
 *
 * @typeParam TUser - User shape returned by `getUser`.
 * @param options - Guard callbacks and denied handler used by protected routes.
 * @returns A factory that creates middleware for route-level access checks.
 */
export function createAccessMiddleware<TUser = unknown>(
  options: CreateAccessHelpersConfig<TUser>
) {
  const { onDenied, ...guardOptions } = options
  const guard = createGuard(guardOptions)

  return function accessMiddleware(config: RouterRouteConfig): MiddlewareFunction {
    return async (args, next) => {
      const result = resolveRouteAccess(guard, config)

      if (!result.allowed) {
        return onDenied({
          result,
          request: args.request,
          params: args.params,
          context: args.context,
          config,
        })
      }

      return next()
    }
  }
}
