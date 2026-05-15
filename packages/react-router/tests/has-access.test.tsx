/* @vitest-environment jsdom */

import { cleanup, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { AccessProvider } from '../src/AccessProvider'
import { HasAccess, useHasAccess } from '../src/HasAccess'

function Wrapper({ user, children }: { user: unknown; children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <AccessProvider
        getUser={() => user}
        hasRole={(u: { roles: string[] }, roles) => roles.some((r) => u.roles.includes(r))}
        hasPermission={(u: { permissions: string[] }, perms) =>
          perms.every((p) => u.permissions.includes(p))
        }
      >
        <Routes>
          <Route path="*" element={children} />
        </Routes>
      </AccessProvider>
    </MemoryRouter>
  )
}

describe('useHasAccess', () => {
  afterEach(cleanup)

  it('returns true for authenticated user on authenticated route', () => {
    const { result } = renderHook(() => useHasAccess({ access: 'authenticated' }), {
      wrapper: ({ children }) => (
        <Wrapper user={{ roles: [], permissions: [] }}>{children}</Wrapper>
      ),
    })
    expect(result.current).toBe(true)
  })

  it('returns false for unauthenticated user on authenticated route', () => {
    const { result } = renderHook(() => useHasAccess({ access: 'authenticated' }), {
      wrapper: ({ children }) => <Wrapper user={null}>{children}</Wrapper>,
    })
    expect(result.current).toBe(false)
  })

  it('returns true when user has required role', () => {
    const { result } = renderHook(() => useHasAccess({ roles: ['admin'] }), {
      wrapper: ({ children }) => (
        <Wrapper user={{ roles: ['admin'], permissions: [] }}>{children}</Wrapper>
      ),
    })
    expect(result.current).toBe(true)
  })

  it('returns false when user lacks required role', () => {
    const { result } = renderHook(() => useHasAccess({ roles: ['admin'] }), {
      wrapper: ({ children }) => (
        <Wrapper user={{ roles: ['member'], permissions: [] }}>{children}</Wrapper>
      ),
    })
    expect(result.current).toBe(false)
  })

  it('returns true when user has all required permissions', () => {
    const { result } = renderHook(
      () => useHasAccess({ permissions: ['reports:read'] }),
      {
        wrapper: ({ children }) => (
          <Wrapper user={{ roles: [], permissions: ['reports:read'] }}>{children}</Wrapper>
        ),
      }
    )
    expect(result.current).toBe(true)
  })

  it('returns false when user lacks required permissions', () => {
    const { result } = renderHook(
      () => useHasAccess({ permissions: ['reports:write'] }),
      {
        wrapper: ({ children }) => (
          <Wrapper user={{ roles: [], permissions: ['reports:read'] }}>{children}</Wrapper>
        ),
      }
    )
    expect(result.current).toBe(false)
  })
})

describe('HasAccess', () => {
  afterEach(cleanup)

  it('renders children when access is allowed', () => {
    render(
      <Wrapper user={{ roles: ['admin'], permissions: [] }}>
        <HasAccess roles={['admin']}>
          <button>Delete</button>
        </HasAccess>
      </Wrapper>
    )
    expect(screen.getByText('Delete')).toBeTruthy()
  })

  it('renders nothing when access is denied', () => {
    render(
      <Wrapper user={{ roles: ['member'], permissions: [] }}>
        <HasAccess roles={['admin']}>
          <button>Delete</button>
        </HasAccess>
      </Wrapper>
    )
    expect(screen.queryByText('Delete')).toBeNull()
  })

  it('renders nothing for unauthenticated user on authenticated content', () => {
    render(
      <Wrapper user={null}>
        <HasAccess access="authenticated">
          <span>secret</span>
        </HasAccess>
      </Wrapper>
    )
    expect(screen.queryByText('secret')).toBeNull()
  })

  it('renders children when no restrictions are set', () => {
    render(
      <Wrapper user={null}>
        <HasAccess>
          <span>public content</span>
        </HasAccess>
      </Wrapper>
    )
    expect(screen.getByText('public content')).toBeTruthy()
  })
})
