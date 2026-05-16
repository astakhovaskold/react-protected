/* @vitest-environment jsdom */

import { AccessProvider } from '@react-protected/react'
import { cleanup, render, renderHook,screen  } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { AccessRoute, useRouteAccess } from '../src/AccessRoute'

describe('AccessRoute', () => {
  afterEach(cleanup)

  it('renders children when access is allowed', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AccessProvider
          getUser={() => ({ role: 'admin', permissions: ['reports:read'] })}
          hasRole={(user, roles) => roles.includes(user.role)}
          hasPermission={(user, permissions) =>
            permissions.every((p) => user.permissions.includes(p))
          }
        >
          <Routes>
            <Route
              path="/dashboard"
              element={
                <AccessRoute
                  access="authenticated"
                  roles={['admin']}
                  permissions={['reports:read']}
                >
                  <div>dashboard</div>
                </AccessRoute>
              }
            />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )
    expect(screen.getByText('dashboard')).toBeTruthy()
  })

  it('renders Outlet when no children provided (layout guard pattern)', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AccessProvider getUser={() => ({ id: 1 })}>
          <Routes>
            <Route path="/dashboard" element={<AccessRoute access="authenticated" />}>
              <Route index element={<div>outlet content</div>} />
            </Route>
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )
    expect(screen.getByText('outlet content')).toBeTruthy()
  })

  it('redirects unauthenticated user to loginPath', () => {
    render(
      <MemoryRouter initialEntries={['/private']}>
        <AccessProvider getUser={() => null} loginPath="/login">
          <Routes>
            <Route
              path="/private"
              element={
                <AccessRoute access="authenticated">
                  <div>private</div>
                </AccessRoute>
              }
            />
            <Route path="/login" element={<div data-testid="login" />} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('login')).toBeTruthy()
  })

  it('appends callbackUrl when callbackUrlParam is configured', () => {
    function LoginPage() {
      const location = useLocation()
      return (
        <div data-testid="callback">
          {new URLSearchParams(location.search).get('next')}
        </div>
      )
    }

    render(
      <MemoryRouter initialEntries={['/private?tab=overview#section']}>
        <AccessProvider getUser={() => null} callbackUrlParam="next">
          <Routes>
            <Route
              path="/private"
              element={
                <AccessRoute access="authenticated">
                  <div>private</div>
                </AccessRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('callback').textContent).toBe(
      '/private?tab=overview#section'
    )
  })

  it('omits callbackUrl when shouldAddCallbackUrl returns false', () => {
    function LoginPage() {
      const location = useLocation()
      return (
        <div data-testid="login">
          {location.pathname}
          {location.search}
        </div>
      )
    }

    render(
      <MemoryRouter initialEntries={['/private']}>
        <AccessProvider
          getUser={() => null}
          callbackUrlParam="next"
          shouldAddCallbackUrl={() => false}
        >
          <Routes>
            <Route
              path="/private"
              element={
                <AccessRoute access="authenticated">
                  <div>private</div>
                </AccessRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('login').textContent).toBe('/login')
  })

  it('appends callbackUrl when shouldAddCallbackUrl returns true', () => {
    function LoginPage() {
      const location = useLocation()
      return (
        <div data-testid="callback">
          {new URLSearchParams(location.search).get('next')}
        </div>
      )
    }

    render(
      <MemoryRouter initialEntries={['/private']}>
        <AccessProvider
          getUser={() => null}
          callbackUrlParam="next"
          shouldAddCallbackUrl={() => true}
        >
          <Routes>
            <Route
              path="/private"
              element={
                <AccessRoute access="authenticated">
                  <div>private</div>
                </AccessRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('callback').textContent).toBe('/private')
  })

  it('redirects authenticated user away from guest-only route', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AccessProvider getUser={() => ({ role: 'member' })} defaultPath="/home">
          <Routes>
            <Route
              path="/login"
              element={
                <AccessRoute access="guest-only">
                  <div>guest page</div>
                </AccessRoute>
              }
            />
            <Route path="/home" element={<div>home page</div>} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )
    expect(screen.getByText('home page')).toBeTruthy()
  })

  it('redirects user without required role to forbiddenPath', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AccessProvider
          getUser={() => ({ role: 'member' })}
          hasRole={(user, roles) => roles.includes(user.role)}
          forbiddenPath="/403"
        >
          <Routes>
            <Route
              path="/admin"
              element={
                <AccessRoute roles={['admin']}>
                  <div>admin</div>
                </AccessRoute>
              }
            />
            <Route path="/403" element={<div>forbidden</div>} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )
    expect(screen.getByText('forbidden')).toBeTruthy()
  })

  it('updates redirect path when provider loginPath changes', () => {
    function LoginPage() {
      return <div data-testid="login-path">{useLocation().pathname}</div>
    }

    const { rerender } = render(
      <MemoryRouter key="a" initialEntries={['/private']}>
        <AccessProvider getUser={() => null} loginPath="/login">
          <Routes>
            <Route
              path="/private"
              element={
                <AccessRoute access="authenticated">
                  <div>private</div>
                </AccessRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signin" element={<LoginPage />} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('login-path').textContent).toBe('/login')

    rerender(
      <MemoryRouter key="b" initialEntries={['/private']}>
        <AccessProvider getUser={() => null} loginPath="/signin">
          <Routes>
            <Route
              path="/private"
              element={
                <AccessRoute access="authenticated">
                  <div>private</div>
                </AccessRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signin" element={<LoginPage />} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('login-path').textContent).toBe('/signin')
  })
})

describe('useRouteAccess', () => {
  afterEach(cleanup)

  it('returns full AccessResult from guard.check()', () => {
    const { result } = renderHook(
      () => useRouteAccess({ access: 'authenticated' }),
      {
        wrapper: ({ children }) => (
          <MemoryRouter>
            <AccessProvider getUser={() => null}>{children}</AccessProvider>
          </MemoryRouter>
        ),
      }
    )
    expect(result.current).toEqual({ allowed: false, reason: 'unauthenticated' })
  })
})
