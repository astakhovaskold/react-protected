/* @vitest-environment jsdom */

import { cleanup, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useAccess } from '../src/AccessProvider'
import { HasAccess, useHasAccess } from '../src/HasAccess'
import { MockAccessProvider } from '../src/testing'

type TestUser = { id: number; roles: Array<string>; authorities: Array<string> }

afterEach(cleanup)

describe('MockAccessProvider — defaults', () => {
  it('allows all checks when allowed=true (default)', () => {
    const { result } = renderHook(
      () => ({
        auth: useHasAccess({ access: 'authenticated' }),
        role: useHasAccess({ roles: ['admin'] }),
        perm: useHasAccess({ permissions: ['reports:write'] }),
      }),
      { wrapper: ({ children }) => <MockAccessProvider>{children}</MockAccessProvider> }
    )

    expect(result.current.auth).toBe(true)
    expect(result.current.role).toBe(true)
    expect(result.current.perm).toBe(true)
  })

  it('blocks all checks when allowed=false', () => {
    const { result } = renderHook(
      () => ({
        auth: useHasAccess({ access: 'authenticated' }),
        role: useHasAccess({ roles: ['admin'] }),
        perm: useHasAccess({ permissions: ['reports:write'] }),
      }),
      {
        wrapper: ({ children }) => (
          <MockAccessProvider allowed={false}>{children}</MockAccessProvider>
        ),
      }
    )

    expect(result.current.auth).toBe(false)
    expect(result.current.role).toBe(false)
    expect(result.current.perm).toBe(false)
  })

  it('uses default navigation paths', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: ({ children }) => <MockAccessProvider>{children}</MockAccessProvider>,
    })

    expect(result.current.loginPath).toBe('/login')
    expect(result.current.forbiddenPath).toBe('/403')
    expect(result.current.defaultPath).toBe('/')
  })
})

describe('MockAccessProvider — navigation config', () => {
  it('forwards custom navigation paths', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: ({ children }) => (
        <MockAccessProvider loginPath="/auth" forbiddenPath="/no-access" defaultPath="/home">
          {children}
        </MockAccessProvider>
      ),
    })

    expect(result.current.loginPath).toBe('/auth')
    expect(result.current.forbiddenPath).toBe('/no-access')
    expect(result.current.defaultPath).toBe('/home')
  })
})

describe('MockAccessProvider — user prop', () => {
  it('exposes user via getUser when user prop is set', () => {
    const mockUser: TestUser = { id: 1, roles: ['admin'], authorities: [] }

    const { result } = renderHook(() => useAccess<TestUser>(), {
      wrapper: ({ children }) => (
        <MockAccessProvider user={mockUser}>{children}</MockAccessProvider>
      ),
    })

    expect(result.current.guard.options.getUser()).toEqual(mockUser)
  })

  it('returns null by default when no user prop is provided', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: ({ children }) => <MockAccessProvider>{children}</MockAccessProvider>,
    })

    expect(result.current.guard.options.getUser()).toBeNull()
  })
})

describe('MockAccessProvider — custom guard overrides', () => {
  it('uses custom hasRole when provided', () => {
    const mockUser: TestUser = { id: 1, roles: ['editor'], authorities: [] }

    const { result } = renderHook(
      () => ({
        hasAdmin: useHasAccess({ roles: ['admin'] }),
        hasEditor: useHasAccess({ roles: ['editor'] }),
      }),
      {
        wrapper: ({ children }) => (
          <MockAccessProvider
            user={mockUser}
            hasRole={(user, roles) => roles.some((r) => user.roles.includes(r))}
          >
            {children}
          </MockAccessProvider>
        ),
      }
    )

    expect(result.current.hasAdmin).toBe(false)
    expect(result.current.hasEditor).toBe(true)
  })

  it('uses custom hasPermission when provided', () => {
    const mockUser: TestUser = { id: 1, roles: [], authorities: ['reports:read'] }

    const { result } = renderHook(
      () => ({
        canRead: useHasAccess({ permissions: ['reports:read'] }),
        canWrite: useHasAccess({ permissions: ['reports:write'] }),
      }),
      {
        wrapper: ({ children }) => (
          <MockAccessProvider
            user={mockUser}
            hasPermission={(user, perms) => perms.every((p) => user.authorities.includes(p))}
          >
            {children}
          </MockAccessProvider>
        ),
      }
    )

    expect(result.current.canRead).toBe(true)
    expect(result.current.canWrite).toBe(false)
  })

  it('uses custom isAuthenticated when provided', () => {
    const { result } = renderHook(() => useHasAccess({ access: 'authenticated' }), {
      wrapper: ({ children }) => (
        <MockAccessProvider
          user={null}
          isAuthenticated={() => false}
        >
          {children}
        </MockAccessProvider>
      ),
    })

    expect(result.current).toBe(false)
  })

  it('uses custom getUser when provided', () => {
    const customUser = { id: 42, roles: [], authorities: [] }

    const { result } = renderHook(() => useAccess<TestUser>(), {
      wrapper: ({ children }) => (
        <MockAccessProvider getUser={() => customUser}>{children}</MockAccessProvider>
      ),
    })

    expect(result.current.guard.options.getUser()).toEqual(customUser)
  })
})

describe('MockAccessProvider — integration with HasAccess', () => {
  it('renders children when allowed=true (default)', () => {
    render(
      <MockAccessProvider>
        <HasAccess roles={['admin']}>
          <button type="button">Delete</button>
        </HasAccess>
      </MockAccessProvider>
    )

    expect(screen.getByText('Delete')).toBeTruthy()
  })

  it('hides children when allowed=false', () => {
    render(
      <MockAccessProvider allowed={false}>
        <HasAccess roles={['admin']}>
          <button type="button">Delete</button>
        </HasAccess>
      </MockAccessProvider>
    )

    expect(screen.queryByText('Delete')).toBeNull()
  })

  it('renders children with real role logic matching the user', () => {
    const mockUser: TestUser = { id: 1, roles: ['viewer'], authorities: [] }

    render(
      <MockAccessProvider
        user={mockUser}
        hasRole={(user, roles) => roles.some((r) => user.roles.includes(r))}
      >
        <HasAccess roles={['admin']}>
          <span>admin-only</span>
        </HasAccess>
        <HasAccess roles={['viewer']}>
          <span>viewer-content</span>
        </HasAccess>
      </MockAccessProvider>
    )

    expect(screen.queryByText('admin-only')).toBeNull()
    expect(screen.getByText('viewer-content')).toBeTruthy()
  })
})
