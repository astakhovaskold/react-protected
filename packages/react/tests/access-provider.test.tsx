/* @vitest-environment jsdom */

import { renderHook } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AccessProvider, useAccess } from '../src/AccessProvider'

describe('AccessProvider', () => {
  it('throws when useAccess is called outside the provider', () => {
    function Consumer() {
      useAccess()
      return null
    }

    expect(() => renderToString(<Consumer />)).toThrowError(
      'useAccess must be used within <AccessProvider>'
    )
  })

  it('provides guard to descendants', () => {
    let ctx: ReturnType<typeof useAccess<{ role: string }>> | undefined

    function Consumer() {
      ctx = useAccess<{ role: string }>()
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

    expect(ctx?.guard.check({ roles: ['admin'] })).toEqual({ allowed: true })
  })

  it('creates a new guard when props change', () => {
    // unauthenticated
    expect(
      renderHook(() => useAccess(), {
        wrapper: ({ children }) => (
          <AccessProvider getUser={() => null}>{children}</AccessProvider>
        ),
      }).result.current.guard.check({ access: 'authenticated' }).allowed
    ).toBe(false)

    // authenticated
    expect(
      renderHook(() => useAccess(), {
        wrapper: ({ children }) => (
          <AccessProvider getUser={() => ({ id: 1 })}>{children}</AccessProvider>
        ),
      }).result.current.guard.check({ access: 'authenticated' }).allowed
    ).toBe(true)
  })

  it('supports unauthenticated access checks through the shared guard', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: ({ children }) => (
        <AccessProvider getUser={() => ({ id: 1 })}>{children}</AccessProvider>
      ),
    })

    expect(result.current.guard.check({ access: 'unauthenticated' })).toEqual({
      allowed: false,
      reason: 'authenticated',
    })
  })
})
