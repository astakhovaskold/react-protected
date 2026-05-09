import type { RouteObject } from 'react-router-dom'
import type { RouteConfig, GuardOptions } from '@react-protected/core'

// Расширяем RouteConfig полями React Router
export type ProtectedRouteObject<TUser = unknown> =
  Omit<RouteObject, 'children'> &
  RouteConfig<TUser> & {
    children?: ProtectedRouteObject<TUser>[]
  }

export type CreateRouterGuardOptions<TUser = unknown> =
  GuardOptions<TUser> & {
    // Компонент-заглушка пока проверяется доступ (опционально)
    loadingElement?: React.ReactNode
  }
