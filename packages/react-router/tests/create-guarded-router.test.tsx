/* @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import {
  type ActionFunctionArgs,
  type RouteObject,
  RouterProvider,
} from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ProtectedRouteObject } from '../src/types'
import {
  captureCreateGuardedRouterCall,
  createGuardedMemoryRouter,
  NativeRequest,
} from './test-helpers'

describe('createGuardedRouter', () => {
  afterEach(() => {
    cleanup()
    vi.resetModules()
    vi.doUnmock('react-router-dom')
    globalThis.Request = NativeRequest
  })

  it('renders child routes for guarded layout routes with element null', async () => {
    const router = await createGuardedMemoryRouter(
      [
        {
          path: '/layout',
          access: 'authenticated',
          element: null,
          children: [
            {
              index: true,
              element: <div>layout child</div>,
            },
          ],
        },
      ],
      {
        getUser: () => ({ id: 'user-1' }),
      },
      ['/layout']
    )

    render(<RouterProvider router={router} />)

    expect(await screen.findByText('layout child')).toBeTruthy()
    router.dispose()
  })

  it('renders guarded Component routes created via createGuardedRouter', async () => {
    const router = await createGuardedMemoryRouter(
      [
        {
          path: '/component',
          access: 'authenticated',
          Component: () => <div>component dashboard</div>,
        },
      ],
      {
        getUser: () => ({ id: 'user-1' }),
      },
      ['/component']
    )

    render(<RouterProvider router={router} />)

    expect(await screen.findByText('component dashboard')).toBeTruthy()
    router.dispose()
  })

  it('renders guarded lazy route components created via createGuardedRouter', async () => {
    const router = await createGuardedMemoryRouter(
      [
        {
          path: '/lazy',
          access: 'authenticated',
          lazy: async () => ({
            Component: () => <div>lazy dashboard</div>,
          }),
        },
      ],
      {
        getUser: () => ({ id: 'user-1' }),
      },
      ['/lazy']
    )

    render(<RouterProvider router={router} />)

    expect(await screen.findByText('lazy dashboard')).toBeTruthy()
    router.dispose()
  })

  it('renders guarded object-form lazy route components created via createGuardedRouter', async () => {
    const router = await createGuardedMemoryRouter(
      [
        {
          path: '/lazy-object',
          access: 'authenticated',
          lazy: {
            Component: async () => () => <div>lazy object dashboard</div>,
          },
        },
      ],
      {
        getUser: () => ({ id: 'user-1' }),
      },
      ['/lazy-object']
    )

    render(<RouterProvider router={router} />)

    expect(await screen.findByText('lazy object dashboard')).toBeTruthy()
    router.dispose()
  })

  it('does not execute a denied guarded loader before redirecting', async () => {
    let loaderCalls = 0

    const router = await createGuardedMemoryRouter(
      [
        {
          path: '/private',
          access: 'authenticated',
          loader: () => {
            loaderCalls += 1
            return null
          },
          element: <div>private page</div>,
        },
        {
          path: '/login',
          element: <div>login page</div>,
        },
      ],
      {
        getUser: () => null,
      },
      ['/private']
    )

    render(<RouterProvider router={router} />)

    expect(await screen.findByText('login page')).toBeTruthy()
    expect(loaderCalls).toBe(0)
    router.dispose()
  })

  it('does not execute a denied guarded action before redirecting', async () => {
    let actionCalls = 0
    let capturedRoutes: Array<RouteObject> | undefined

    vi.resetModules()
    globalThis.Request = NativeRequest

    vi.doMock('react-router-dom', async () => {
      const actual =
        await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

      return {
        ...actual,
        createBrowserRouter: (guardedRoutes: Array<RouteObject>) => {
          capturedRoutes = guardedRoutes as Array<RouteObject>
          return { mocked: true }
        },
      }
    })

    const { createGuardedRouter } = await import('../src/createGuardedRouter')

    createGuardedRouter(
      [
        {
          path: '/private',
          access: 'authenticated',
          action: async () => {
            actionCalls += 1
            return null
          },
          element: <div>private page</div>,
        },
      ],
      {
        getUser: () => null,
      }
    )

    vi.doUnmock('react-router-dom')

    const action = capturedRoutes?.[0]?.action
    expect(action).toBeTypeOf('function')

    if (typeof action !== 'function') {
      throw new Error('Expected guarded action wrapper to be defined')
    }

    const result = await action({
      request: new Request('https://example.test/private', { method: 'POST' }),
      params: {},
      context: undefined,
    } as ActionFunctionArgs)

    expect(actionCalls).toBe(0)
    expect(result instanceof Response).toBe(true)

    if (!(result instanceof Response)) {
      throw new Error('Expected denied action to return a redirect response')
    }

    expect(result.status).toBe(302)
    expect(result.headers.get('Location')).toBe('/login?callbackUrl=%2Fprivate')
  })

  it('preserves static UI precedence over function-form lazy UI', async () => {
    const router = await createGuardedMemoryRouter(
      [
        {
          path: '/lazy-static',
          access: 'authenticated',
          element: <div>static dashboard</div>,
          lazy: async () => ({
            Component: () => <div>lazy dashboard</div>,
            loader: async () => 'loader data',
          }),
        },
      ],
      {
        getUser: () => ({ id: 'user-1' }),
      },
      ['/lazy-static']
    )

    render(<RouterProvider router={router} />)

    expect(await screen.findByText('static dashboard')).toBeTruthy()
    expect(screen.queryByText('lazy dashboard')).toBeNull()
    router.dispose()
  })

  it('passes router options through to createBrowserRouter', async () => {
    const [, routerOptions] = await captureCreateGuardedRouterCall(
      [
        {
          path: '/app',
          element: <div>app</div>,
        } satisfies ProtectedRouteObject<{ id: string }>,
      ],
      {
        getUser: () => ({ id: 'user-1' }),
      },
      {
        basename: '/base',
        future: { v8_middleware: true },
      }
    )

    expect(routerOptions).toEqual({
      basename: '/base',
      future: { v8_middleware: true },
    })
  })
})
