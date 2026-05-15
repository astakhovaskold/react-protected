import type { RouteObject } from 'react-router-dom'
import { vi } from 'vitest'

import type { ProtectedRouteObject } from '../src/types'
import type { CreateAccessRouterConfig } from '../src/types'

export const NativeRequest = globalThis.Request

export class TestRequest extends NativeRequest {
  constructor(input: ConstructorParameters<typeof Request>[0], init?: RequestInit) {
    super(input, init ? { ...init, signal: undefined } : init)
  }
}

export async function createAccessMemoryRouter<TUser>(
  routes: Array<ProtectedRouteObject<TUser>>,
  options: CreateAccessRouterConfig<TUser>,
  initialEntries: Array<string>,
  routerOptions?: { basename?: string; future?: Record<string, unknown> }
) {
  vi.resetModules()
  globalThis.Request = TestRequest as typeof Request

  vi.doMock('react-router-dom', async () => {
    const actual =
      await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

    return {
      ...actual,
      createBrowserRouter: (
        guardedRoutes: Array<RouteObject>,
        createRouterOptions?: { basename?: string; future?: Record<string, unknown> }
      ) =>
        actual.createMemoryRouter(guardedRoutes, {
          initialEntries,
          basename: createRouterOptions?.basename,
          future: createRouterOptions?.future,
        }),
    }
  })

  const { createAccessRouter } = await import('../src/createAccessRouter')
  const router = createAccessRouter(routes, options, routerOptions)

  vi.doUnmock('react-router-dom')

  return router
}

export async function captureCreateAccessRouterCall<TUser>(
  routes: Array<ProtectedRouteObject<TUser>>,
  options: CreateAccessRouterConfig<TUser>,
  routerOptions?: { basename?: string; future?: Record<string, unknown> }
) {
  vi.resetModules()

  const createBrowserRouterSpy = vi.fn(() => ({ mocked: true }))

  vi.doMock('react-router-dom', async () => {
    const actual =
      await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

    return {
      ...actual,
      createBrowserRouter: createBrowserRouterSpy,
    }
  })

  const { createAccessRouter } = await import('../src/createAccessRouter')

  createAccessRouter(routes, options, routerOptions)

  vi.doUnmock('react-router-dom')

  return createBrowserRouterSpy.mock.calls[0] as unknown as [
    unknown,
    { basename?: string; future?: Record<string, unknown> } | undefined,
  ]
}
