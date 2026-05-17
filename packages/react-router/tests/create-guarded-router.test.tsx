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
  captureCreateAccessRouterCall,
  createAccessMemoryRouter,
  NativeRequest,
} from './test-helpers'

describe('createAccessRouter', () => {
  afterEach(() => {
    cleanup()
    vi.resetModules()
    vi.doUnmock('react-router-dom')
    globalThis.Request = NativeRequest
  })

  it('renders child routes for guarded layout routes with element null', async () => {
    const router = await createAccessMemoryRouter(
      [
        {
          path: '/layout',
          access: 'authenticated',
          element: null,
          children: [{ index: true, element: <div>layout child</div> }],
        },
      ],
      { getUser: () => ({ id: 'user-1' }) },
      ['/layout']
    )

    render(<RouterProvider router={router} />)
    expect(await screen.findByText('layout child')).toBeTruthy()
    router.dispose()
  })

  it('renders guarded Component routes', async () => {
    const router = await createAccessMemoryRouter(
      [
        {
          path: '/component',
          access: 'authenticated',
          Component: () => <div>component dashboard</div>,
        },
      ],
      { getUser: () => ({ id: 'user-1' }) },
      ['/component']
    )

    render(<RouterProvider router={router} />)
    expect(await screen.findByText('component dashboard')).toBeTruthy()
    router.dispose()
  })

  it('renders guarded function-form lazy routes', async () => {
    const router = await createAccessMemoryRouter(
      [
        {
          path: '/lazy',
          access: 'authenticated',
          lazy: async () => ({ Component: () => <div>lazy dashboard</div> }),
        },
      ],
      { getUser: () => ({ id: 'user-1' }) },
      ['/lazy']
    )

    render(<RouterProvider router={router} />)
    expect(await screen.findByText('lazy dashboard')).toBeTruthy()
    router.dispose()
  })

  it('renders guarded object-form lazy routes', async () => {
    const router = await createAccessMemoryRouter(
      [
        {
          path: '/lazy-object',
          access: 'authenticated',
          lazy: { Component: async () => () => <div>lazy object dashboard</div> },
        },
      ],
      { getUser: () => ({ id: 'user-1' }) },
      ['/lazy-object']
    )

    render(<RouterProvider router={router} />)
    expect(await screen.findByText('lazy object dashboard')).toBeTruthy()
    router.dispose()
  })

  it('does not execute loader when access is denied', async () => {
    let loaderCalls = 0

    const router = await createAccessMemoryRouter(
      [
        {
          path: '/private',
          access: 'authenticated',
          loader: () => { loaderCalls += 1; return null },
          element: <div>private page</div>,
        },
        { path: '/login', element: <div>login page</div> },
      ],
      { getUser: () => null },
      ['/private']
    )

    render(<RouterProvider router={router} />)
    expect(await screen.findByText('login page')).toBeTruthy()
    expect(loaderCalls).toBe(0)
    router.dispose()
  })

  it('does not execute nested child loader when parent access is denied', async () => {
    let childLoaderCalls = 0

    const router = await createAccessMemoryRouter(
      [
        {
          path: '/private',
          access: 'authenticated',
          element: null,
          children: [
            {
              index: true,
              loader: () => {
                childLoaderCalls += 1
                return null
              },
              element: <div>private child</div>,
            },
          ],
        },
        { path: '/login', element: <div>login page</div> },
      ],
      { getUser: () => null },
      ['/private']
    )

    render(<RouterProvider router={router} />)
    expect(await screen.findByText('login page')).toBeTruthy()
    expect(childLoaderCalls).toBe(0)
    router.dispose()
  })

  it('does not execute action when access is denied, redirects to loginPath', async () => {
    let actionCalls = 0
    let capturedRoutes: Array<RouteObject> | undefined

    vi.resetModules()
    globalThis.Request = NativeRequest

    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
      return {
        ...actual,
        createBrowserRouter: (guardedRoutes: Array<RouteObject>) => {
          capturedRoutes = guardedRoutes
          return { mocked: true }
        },
      }
    })

    const { createAccessRouter } = await import('../src/createAccessRouter')

    createAccessRouter(
      [
        {
          path: '/private',
          access: 'authenticated',
          action: async () => { actionCalls += 1; return null },
          element: <div>private page</div>,
        },
      ],
      { getUser: () => null }
    )

    vi.doUnmock('react-router-dom')

    const action = capturedRoutes?.[0]?.action
    expect(action).toBeTypeOf('function')
    if (typeof action !== 'function') throw new Error('Expected action to be function')

    const result = await action({
      request: new Request('https://example.test/private', { method: 'POST' }),
      params: {},
      context: undefined,
    } as ActionFunctionArgs)

    expect(actionCalls).toBe(0)
    expect(result instanceof Response).toBe(true)
    if (!(result instanceof Response)) throw new Error('Expected Response')
    expect(result.status).toBe(302)
    expect(result.headers.get('Location')).toBe('/login')
  })

  it('does not execute nested child action when parent access is denied', async () => {
    let childActionCalls = 0
    let capturedRoutes: Array<RouteObject> | undefined

    vi.resetModules()
    globalThis.Request = NativeRequest

    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
      return {
        ...actual,
        createBrowserRouter: (guardedRoutes: Array<RouteObject>) => {
          capturedRoutes = guardedRoutes
          return { mocked: true }
        },
      }
    })

    const { createAccessRouter } = await import('../src/createAccessRouter')

    createAccessRouter(
      [
        {
          path: '/private',
          access: 'authenticated',
          element: null,
          children: [
            {
              index: true,
              action: async () => {
                childActionCalls += 1
                return null
              },
              element: <div>private child</div>,
            },
          ],
        },
      ],
      { getUser: () => null }
    )

    vi.doUnmock('react-router-dom')

    const action = capturedRoutes?.[0]?.children?.[0]?.action
    expect(action).toBeTypeOf('function')
    if (typeof action !== 'function') throw new Error('Expected action to be function')

    const result = await action({
      request: new Request('https://example.test/private', { method: 'POST' }),
      params: {},
      context: undefined,
    } as ActionFunctionArgs)

    expect(childActionCalls).toBe(0)
    expect(result instanceof Response).toBe(true)
    if (!(result instanceof Response)) throw new Error('Expected Response')
    expect(result.status).toBe(302)
    expect(result.headers.get('Location')).toBe('/login')
  })

  it('omits callbackUrl in action redirect when shouldAddCallbackUrl returns false', async () => {
    let capturedRoutes: Array<RouteObject> | undefined

    vi.resetModules()
    globalThis.Request = NativeRequest

    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
      return {
        ...actual,
        createBrowserRouter: (guardedRoutes: Array<RouteObject>) => {
          capturedRoutes = guardedRoutes
          return { mocked: true }
        },
      }
    })

    const { createAccessRouter } = await import('../src/createAccessRouter')

    createAccessRouter(
      [
        {
          path: '/private',
          access: 'authenticated',
          action: async () => null,
          element: <div>private</div>,
        },
      ],
      { getUser: () => null, callbackUrlParam: 'next', shouldAddCallbackUrl: () => false }
    )

    vi.doUnmock('react-router-dom')

    const action = capturedRoutes?.[0]?.action
    if (typeof action !== 'function') throw new Error('Expected action to be function')

    const result = await action({
      request: new Request('https://example.test/private', { method: 'POST' }),
      params: {},
      context: undefined,
    } as ActionFunctionArgs)

    expect(result instanceof Response).toBe(true)
    if (!(result instanceof Response)) throw new Error('Expected Response')
    expect(result.headers.get('Location')).toBe('/login')
  })

  it('appends callbackUrl in action redirect when callbackUrlParam is set', async () => {
    let capturedRoutes: Array<RouteObject> | undefined

    vi.resetModules()
    globalThis.Request = NativeRequest

    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
      return {
        ...actual,
        createBrowserRouter: (guardedRoutes: Array<RouteObject>) => {
          capturedRoutes = guardedRoutes
          return { mocked: true }
        },
      }
    })

    const { createAccessRouter } = await import('../src/createAccessRouter')

    createAccessRouter(
      [
        {
          path: '/private',
          access: 'authenticated',
          action: async () => null,
          element: <div>private</div>,
        },
      ],
      { getUser: () => null, callbackUrlParam: 'callbackUrl' }
    )

    vi.doUnmock('react-router-dom')

    const action = capturedRoutes?.[0]?.action
    if (typeof action !== 'function') throw new Error('Expected action to be function')

    const result = await action({
      request: new Request('https://example.test/private?from=email', { method: 'POST' }),
      params: {},
      context: undefined,
    } as ActionFunctionArgs)

    expect(result instanceof Response).toBe(true)
    if (!(result instanceof Response)) throw new Error('Expected Response')
    expect(result.headers.get('Location')).toBe('/login?callbackUrl=%2Fprivate%3Ffrom%3Demail')
  })

  it('preserves static UI over function-form lazy UI', async () => {
    const router = await createAccessMemoryRouter(
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
      { getUser: () => ({ id: 'user-1' }) },
      ['/lazy-static']
    )

    render(<RouterProvider router={router} />)
    expect(await screen.findByText('static dashboard')).toBeTruthy()
    expect(screen.queryByText('lazy dashboard')).toBeNull()
    router.dispose()
  })

  it('passes router options through to createBrowserRouter', async () => {
    const [, routerOptions] = await captureCreateAccessRouterCall(
      [{ path: '/app', element: <div>app</div> } satisfies ProtectedRouteObject<{ id: string }>],
      { getUser: () => ({ id: 'user-1' }) },
      { basename: '/base', future: { v8_middleware: true } }
    )

    expect(routerOptions).toEqual({
      basename: '/base',
      future: { v8_middleware: true },
    })
  })
})
