// TODO: реализация
// Идея: createGuardedRouter принимает ProtectedRouteObject[]
// и трансформирует их в стандартные RouteObject[] от React Router,
// оборачивая каждый маршрут в Guard-компонент который вызывает guard.check()
// и делает navigate() если нужен редирект

export { createGuardedRouter } from './createGuardedRouter'
export { GuardProvider } from './GuardProvider'
export type { ProtectedRouteObject, CreateRouterGuardOptions } from './types'
