import { createGuard } from '@react-protected/core'
import type { LoaderFunction, LoaderFunctionArgs } from 'react-router-dom'

import type { CreateAccessHelpersConfig, RouterRouteConfig } from './types'
import { resolveRouteAccess } from './utils/route-access'

/**
 * Creates a guarded React Router loader.
 *
 * @typeParam TUser - User shape returned by `getUser`.
 * @param options - Guard callbacks and denied handler used by protected loaders.
 * @returns A factory that wraps route loaders with access checks and denied handling.
 */
export function createAccessLoader<TUser = unknown>(
  options: CreateAccessHelpersConfig<TUser>
) {
  const { onDenied, ...guardOptions } = options
  const guard = createGuard(guardOptions)

  return function accessLoader<TResult = unknown>(
    config: RouterRouteConfig,
    loader?: (args: LoaderFunctionArgs) => TResult
  ): LoaderFunction {
    return (args) => {
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

      return loader ? loader(args) : null
    }
  }
}
