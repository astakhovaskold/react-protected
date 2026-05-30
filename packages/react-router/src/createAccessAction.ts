import { createGuard } from '@react-protected/core'
import type { ActionFunction, ActionFunctionArgs } from 'react-router-dom'

import type { CreateAccessHelpersConfig, RouterRouteConfig } from './types'
import { resolveRouteAccess } from './utils/route-access'

/**
 * Creates a guarded React Router action.
 *
 * @typeParam TUser - User shape returned by `getUser`.
 * @param options - Guard callbacks and denied handler used by protected actions.
 * @returns A factory that wraps route actions with access checks and denied handling.
 */
export function createAccessAction<TUser = unknown>(
  options: CreateAccessHelpersConfig<TUser>
) {
  const { onDenied, ...guardOptions } = options
  const guard = createGuard(guardOptions)

  return function accessAction<TResult = unknown>(
    config: RouterRouteConfig,
    action?: (args: ActionFunctionArgs) => TResult
  ): ActionFunction {
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

      return action ? action(args) : null
    }
  }
}
