/* @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { GuardProvider, useGuard } from '../src/GuardProvider'
import { GuardRoute } from '../src/GuardRoute'
import type { GuardContextValue } from '../src/types'

describe('GuardProvider', () => {
  afterEach(() => {
    cleanup()
  })

  it('throws when useGuard is called outside the provider', () => {
    function Consumer() {
      useGuard()
      return null
    }

    expect(() => renderToString(<Consumer />)).toThrowError(
      'useGuard must be used within <GuardProvider>'
    )
  })

  it('provides a guard instance to descendants', () => {
    let guard: GuardContextValue<{ role: string }> | undefined

    function Consumer() {
      guard = useGuard<{ role: string }>()
      return null
    }

    renderToString(
      <GuardProvider
        getUser={() => ({ role: 'admin' })}
        hasRole={(user, roles) => roles.includes(user.role)}
      >
        <Consumer />
      </GuardProvider>
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
        <GuardProvider getUser={() => null} loginPath="/login">
          <Routes>
            <Route
              path="/private"
              element={
                <GuardRoute access="authenticated">
                  <div>private page</div>
                </GuardRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signin" element={<LoginPage />} />
          </Routes>
        </GuardProvider>
      </MemoryRouter>
    )

    expect(screen.getByTestId('pathname').textContent).toBe('/login')

    rerender(
      <MemoryRouter key="signin" initialEntries={['/private']}>
        <GuardProvider getUser={() => null} loginPath="/signin">
          <Routes>
            <Route
              path="/private"
              element={
                <GuardRoute access="authenticated">
                  <div>private page</div>
                </GuardRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signin" element={<LoginPage />} />
          </Routes>
        </GuardProvider>
      </MemoryRouter>
    )

    expect(screen.getByTestId('pathname').textContent).toBe('/signin')
  })
})

describe('GuardRoute', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders children when access is allowed', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <GuardProvider
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
                <GuardRoute
                  access="authenticated"
                  roles={['admin']}
                  permissions={['reports:read']}
                >
                  <div>dashboard</div>
                </GuardRoute>
              }
            />
          </Routes>
        </GuardProvider>
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
        <GuardProvider getUser={() => null}>
          <Routes>
            <Route
              path="/private"
              element={
                <GuardRoute access="authenticated">
                  <div>private</div>
                </GuardRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </GuardProvider>
      </MemoryRouter>
    )

    expect(screen.getByTestId('callback-url').textContent).toBe(
      '/private?tab=overview#section'
    )
  })

  it('redirects authenticated users away from guest-only routes', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <GuardProvider getUser={() => ({ role: 'member' })}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuardRoute access="guest-only">
                  <div>guest page</div>
                </GuardRoute>
              }
            />
            <Route path="/" element={<div>home page</div>} />
          </Routes>
        </GuardProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('home page')).toBeTruthy()
  })

  it('redirects users without required roles to forbidden path', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <GuardProvider
          getUser={() => ({ role: 'member', permissions: ['reports:read'] })}
          hasRole={(user, roles) => roles.includes(user.role)}
        >
          <Routes>
            <Route
              path="/admin"
              element={
                <GuardRoute roles={['admin']}>
                  <div>admin page</div>
                </GuardRoute>
              }
            />
            <Route path="/403" element={<div>forbidden page</div>} />
          </Routes>
        </GuardProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('forbidden page')).toBeTruthy()
  })

  it('redirects users without required permissions to forbidden path', () => {
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <GuardProvider
          getUser={() => ({ role: 'admin', permissions: ['profile:read'] })}
          hasPermission={(user, permissions) =>
            permissions.every((permission) => user.permissions.includes(permission))
          }
        >
          <Routes>
            <Route
              path="/reports"
              element={
                <GuardRoute permissions={['reports:read']}>
                  <div>reports page</div>
                </GuardRoute>
              }
            />
            <Route path="/403" element={<div>forbidden page</div>} />
          </Routes>
        </GuardProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('forbidden page')).toBeTruthy()
  })
})
