/* @vitest-environment jsdom */

import { AccessProvider } from '@react-protected/react'
import { cleanup, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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
            permissions.every((permission) => user.permissions.includes(permission))
          }
        >
          <Routes>
            <Route
              path="/dashboard"
              element={(
                <AccessRoute
                  access="authenticated"
                  roles={['admin']}
                  permissions={['reports:read']}
                  renderDenied={({ reason }) => <div>{reason}</div>}
                >
                  <div>dashboard</div>
                </AccessRoute>
              )}
            />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('dashboard')).toBeTruthy()
  })

  it('renders Outlet when no children are provided', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AccessProvider getUser={() => ({ id: 1 })}>
          <Routes>
            <Route
              path="/dashboard"
              element={<AccessRoute access="authenticated" renderDenied={() => <div>denied</div>} />}
            >
              <Route index element={<div>outlet content</div>} />
            </Route>
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('outlet content')).toBeTruthy()
  })

  it('renders denied content for unauthenticated users', () => {
    render(
      <MemoryRouter initialEntries={['/private']}>
        <AccessProvider getUser={() => null}>
          <Routes>
            <Route
              path="/private"
              element={(
                <AccessRoute
                  access="authenticated"
                  renderDenied={({ reason }) => <div>{reason}</div>}
                >
                  <div>private</div>
                </AccessRoute>
              )}
            />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('unauthenticated')).toBeTruthy()
  })

  it('renders denied content for authenticated users on unauthenticated-only routes', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AccessProvider getUser={() => ({ role: 'member' })}>
          <Routes>
            <Route
              path="/login"
              element={(
                <AccessRoute
                  access="unauthenticated"
                  renderDenied={({ reason }) => <div>{reason}</div>}
                >
                  <div>login page</div>
                </AccessRoute>
              )}
            />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('authenticated')).toBeTruthy()
  })

  it('renders denied content for forbidden users', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AccessProvider
          getUser={() => ({ role: 'member' })}
          hasRole={(user, roles) => roles.includes(user.role)}
        >
          <Routes>
            <Route
              path="/admin"
              element={(
                <AccessRoute
                  roles={['admin']}
                  renderDenied={({ reason }) => <div>{reason}</div>}
                >
                  <div>admin</div>
                </AccessRoute>
              )}
            />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('forbidden')).toBeTruthy()
  })
})

describe('useRouteAccess', () => {
  afterEach(cleanup)

  it('returns unauthenticated for protected routes without a user', () => {
    const { result } = renderHook(() => useRouteAccess({ access: 'authenticated' }), {
      wrapper: ({ children }) => (
        <MemoryRouter>
          <AccessProvider getUser={() => null}>{children}</AccessProvider>
        </MemoryRouter>
      ),
    })

    expect(result.current).toEqual({ allowed: false, reason: 'unauthenticated' })
  })

  it('returns authenticated for unauthenticated-only routes with a user', () => {
    const { result } = renderHook(() => useRouteAccess({ access: 'unauthenticated' }), {
      wrapper: ({ children }) => (
        <MemoryRouter>
          <AccessProvider getUser={() => ({ id: 1 })}>{children}</AccessProvider>
        </MemoryRouter>
      ),
    })

    expect(result.current).toEqual({ allowed: false, reason: 'authenticated' })
  })
})
