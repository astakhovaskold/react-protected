/* @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import {
  type ActionFunctionArgs,
  createMemoryRouter,
  type LoaderFunctionArgs,
  type MiddlewareFunction,
  redirect,
  RouterProvider,
} from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createAccessAction,
  createAccessLoader,
  createAccessMiddleware,
} from '../src'

const NativeRequest = globalThis.Request

class TestRequest extends NativeRequest {
  constructor(input: ConstructorParameters<typeof Request>[0], init?: RequestInit) {
    super(input, init ? { ...init, signal: undefined } : init)
  }
}

describe('route access helpers', () => {
  afterEach(() => {
    cleanup()
    globalThis.Request = NativeRequest
  })

  it('does not execute wrapped loader when access is denied', async () => {
    let loaderCalls = 0

    const accessLoader = createAccessLoader({
      getUser: () => null,
      onDenied: ({ result }) => redirect(`/${result.reason}`),
    })
    const loader = accessLoader(
      { access: 'authenticated' },
      async () => {
        loaderCalls += 1
        return 'private data'
      }
    )

    const result = await loader({
      request: new Request('https://example.test/private?from=email'),
      params: {},
      context: undefined,
    } as LoaderFunctionArgs)

    expect(loaderCalls).toBe(0)
    expect(result instanceof Response).toBe(true)
    if (!(result instanceof Response)) throw new Error('Expected Response')
    expect(result.status).toBe(302)
    expect(result.headers.get('Location')).toBe('/unauthenticated')
  })

  it('returns null when access is allowed and no loader is provided', async () => {
    const accessLoader = createAccessLoader({
      getUser: () => ({ id: 'user-1' }),
      onDenied: () => redirect('/denied'),
    })
    const loader = accessLoader({ access: 'authenticated' })

    expect(
      loader({
        request: new Request('https://example.test/private'),
        params: {},
        context: undefined,
      } as LoaderFunctionArgs)
    ).toBeNull()
  })

  it('does not execute wrapped action when access is denied and delegates to onDenied', async () => {
    let actionCalls = 0

    const accessAction = createAccessAction({
      getUser: () => null,
      onDenied: ({ result, request }) => {
        const url = new URL(request.url)
        return redirect(`/${result.reason}?next=${encodeURIComponent(url.pathname + url.search)}`)
      },
    })
    const action = accessAction(
      { access: 'authenticated' },
      async () => {
        actionCalls += 1
        return { ok: true }
      }
    )

    const result = await action({
      request: new Request('https://example.test/private?from=email', { method: 'POST' }),
      params: {},
      context: undefined,
    } as ActionFunctionArgs)

    expect(actionCalls).toBe(0)
    expect(result instanceof Response).toBe(true)
    if (!(result instanceof Response)) throw new Error('Expected Response')
    expect(result.headers.get('Location')).toBe('/unauthenticated?next=%2Fprivate%3Ffrom%3Demail')
  })

  it('blocks child branch before loader execution when parent middleware redirects', async () => {
    let childLoaderCalls = 0

    const accessMiddleware = createAccessMiddleware({
      getUser: () => null,
      onDenied: ({ result }) => redirect(`/${result.reason}`),
    })
    globalThis.Request = TestRequest as typeof Request

    const router = createMemoryRouter(
      [
        {
          path: '/private',
          middleware: [accessMiddleware({ access: 'authenticated' })],
          children: [
            {
              index: true,
              loader: async () => {
                childLoaderCalls += 1
                return null
              },
              Component: () => <div>private page</div>,
            },
          ],
        },
        {
          path: '/unauthenticated',
          Component: () => <div>unauthenticated page</div>,
        },
      ],
      {
        initialEntries: ['/private'],
        future: { v8_middleware: true },
      }
    )

    render(<RouterProvider router={router} />)

    expect(await screen.findByText('unauthenticated page')).toBeTruthy()
    expect(childLoaderCalls).toBe(0)
    router.dispose()
  })

  it('delegates authenticated denials for unauthenticated-only routes', async () => {
    const accessMiddleware = createAccessMiddleware({
      getUser: () => ({ id: 'user-1' }),
      onDenied: ({ result }) => redirect(`/${result.reason}`),
    })
    globalThis.Request = TestRequest as typeof Request

    const router = createMemoryRouter(
      [
        {
          path: '/login',
          middleware: [accessMiddleware({ access: 'unauthenticated' })],
          Component: () => <div>login page</div>,
        },
        {
          path: '/authenticated',
          Component: () => <div>authenticated page</div>,
        },
      ],
      {
        initialEntries: ['/login'],
        future: { v8_middleware: true },
      }
    )

    render(<RouterProvider router={router} />)

    expect(await screen.findByText('authenticated page')).toBeTruthy()
    router.dispose()
  })

  it('calls next in middleware when access is allowed', async () => {
    const accessMiddleware = createAccessMiddleware({
      getUser: () => ({ role: 'admin' }),
      hasRole: (user, roles) => roles.includes(user.role),
      onDenied: () => redirect('/denied'),
    })

    const middleware = accessMiddleware({ roles: ['admin'] }) as MiddlewareFunction<Response>
    const next = vi.fn(async () => redirect('/dashboard'))

    const result = await middleware(
      {
        request: new Request('https://example.test/admin'),
        params: {},
        context: {} as LoaderFunctionArgs['context'],
      } as Parameters<MiddlewareFunction<Response>>[0],
      next
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(result instanceof Response).toBe(true)
    if (!(result instanceof Response)) throw new Error('Expected Response')
    expect(result.headers.get('Location')).toBe('/dashboard')
  })
})
