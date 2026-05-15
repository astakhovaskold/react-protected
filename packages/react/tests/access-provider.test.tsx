/* @vitest-environment jsdom */

import { renderHook } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AccessProvider, useAccess } from '../src/AccessProvider'
import type { AccessContextValue } from '../src/types'

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

  it('provides guard and navigation config to descendants', () => {
    let ctx: AccessContextValue<{ role: string }> | undefined

    function Consumer() {
      ctx = useAccess<{ role: string }>()
      return null
    }

    renderToString(
      <AccessProvider
        getUser={() => ({ role: 'admin' })}
        hasRole={(user, roles) => roles.includes(user.role)}
        loginPath="/auth"
        forbiddenPath="/no-access"
        defaultPath="/home"
        callbackUrlParam="next"
      >
        <Consumer />
      </AccessProvider>
    )

    expect(ctx?.loginPath).toBe('/auth')
    expect(ctx?.forbiddenPath).toBe('/no-access')
    expect(ctx?.defaultPath).toBe('/home')
    expect(ctx?.callbackUrlParam).toBe('next')
    expect(ctx?.guard.check({ roles: ['admin'] })).toEqual({ allowed: true })
  })

  it('uses default navigation paths when not provided', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: ({ children }) => (
        <AccessProvider getUser={() => null}>{children}</AccessProvider>
      ),
    })

    expect(result.current.loginPath).toBe('/login')
    expect(result.current.forbiddenPath).toBe('/403')
    expect(result.current.defaultPath).toBe('/')
    expect(result.current.callbackUrlParam).toBeUndefined()
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
})
