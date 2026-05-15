/* @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { AccessProvider, useAccess } from '../src/AccessProvider'
import { AccessRoute } from '../src/AccessRoute'
import type { AccessContextValue } from '../src/types'

describe('AccessProvider', () => {
  afterEach(() => {
    cleanup()
  })

  it('throws when useAccess is called outside the provider', () => {
    function Consumer() {
      useAccess()
      return null
    }

    expect(() => renderToString(<Consumer />)).toThrowError(
      'useAccess must be used within <AccessProvider>'
    )
  })

  it('provides a guard instance to descendants', () => {
    let guard: AccessContextValue<{ role: string }> | undefined

    function Consumer() {
      guard = useAccess<{ role: string }>()
      return null
    }

    renderToString(
      <AccessProvider
        getUser={() => ({ role: 'admin' })}
        hasRole={(user, roles) => roles.includes(user.role)}
      >
        <Consumer />
      </AccessProvider>
    )

    expect(guard).toBeDefined()
    expect(guard?.check({ path: '/admin', roles: ['admin'] }, '/admin')).toEqual({
      allowed: true,
    })
  })

  it('updates route redirects when provider props change', () => {
    function LoginPage() {
      const location = useLocation()
      return <div data-testid="pathname">{location.pathname}</div>
    }

    const { rerender } = render(
      <MemoryRouter key="login" initialEntries={['/private']}>
        <AccessProvider getUser={() => null} loginPath="/login">
          <Routes>
            <Route
              path="/private"
              element={
                <AccessRoute access="authenticated">
                  <div>private page</div>
                </AccessRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signin" element={<LoginPage />} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )

    expect(screen.getByTestId('pathname').textContent).toBe('/login')

    rerender(
      <MemoryRouter key="signin" initialEntries={['/private']}>
        <AccessProvider getUser={() => null} loginPath="/signin">
          <Routes>
            <Route
              path="/private"
              element={
                <AccessRoute access="authenticated">
                  <div>private page</div>
                </AccessRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signin" element={<LoginPage />} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )

    expect(screen.getByTestId('pathname').textContent).toBe('/signin')
  })
})

describe('AccessRoute', () => {
  afterEach(() => {
    cleanup()
  })

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

  it('redirects unauthenticated users to login with callbackUrl', () => {
    function LoginPage() {
      const location = useLocation()
      return (
        <div data-testid="callback-url">
          {new URLSearchParams(location.search).get('callbackUrl')}
        </div>
      )
    }

    render(
      <MemoryRouter initialEntries={['/private?tab=overview#section']}>
        <AccessProvider getUser={() => null}>
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

    expect(screen.getByTestId('callback-url').textContent).toBe(
      '/private?tab=overview#section'
    )
  })

  it('redirects authenticated users away from guest-only routes', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AccessProvider getUser={() => ({ role: 'member' })}>
          <Routes>
            <Route
              path="/login"
              element={
                <AccessRoute access="guest-only">
                  <div>guest page</div>
                </AccessRoute>
              }
            />
            <Route path="/" element={<div>home page</div>} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('home page')).toBeTruthy()
  })

  it('redirects users without required roles to forbidden path', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AccessProvider
          getUser={() => ({ role: 'member', permissions: ['reports:read'] })}
          hasRole={(user, roles) => roles.includes(user.role)}
        >
          <Routes>
            <Route
              path="/admin"
              element={
                <AccessRoute roles={['admin']}>
                  <div>admin page</div>
                </AccessRoute>
              }
            />
            <Route path="/403" element={<div>forbidden page</div>} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('forbidden page')).toBeTruthy()
  })

  it('redirects users without required permissions to forbidden path', () => {
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <AccessProvider
          getUser={() => ({ role: 'admin', permissions: ['profile:read'] })}
          hasPermission={(user, permissions) =>
            permissions.every((permission) => user.permissions.includes(permission))
          }
        >
          <Routes>
            <Route
              path="/reports"
              element={
                <AccessRoute permissions={['reports:read']}>
                  <div>reports page</div>
                </AccessRoute>
              }
            />
            <Route path="/403" element={<div>forbidden page</div>} />
          </Routes>
        </AccessProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('forbidden page')).toBeTruthy()
  })
})
