import type { ReactNode } from 'react'

import { useAccess } from './AccessProvider'
import type { RouteProtection } from './types'

type HasAccessProps = RouteProtection & {
  children?: ReactNode
}

/**
 * Returns `true` when the current user satisfies the provided access config.
 *
 * @param config - Access requirements to evaluate with the active guard.
 * @returns `true` when access is allowed, otherwise `false`.
 */
export function useHasAccess(config: RouteProtection): boolean {
  const { guard } = useAccess()
  return guard.check(config).allowed
}

/**
 * Renders its children only when the current user satisfies the access config.
 *
 * @param props - Access requirements and the children to render when allowed.
 * @returns The provided children when access is allowed, otherwise `null`.
 */
export function HasAccess({ access, roles, permissions, meta, children }: HasAccessProps) {
  const allowed = useHasAccess({ access, roles, permissions, meta })
  return allowed ? children ?? null : null
}
