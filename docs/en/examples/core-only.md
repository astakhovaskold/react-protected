# Using the Core Package Without an Adapter

If you are not using React Router, take `@react-protected/core` and wire it into any router manually. The guard itself is pure — it returns an `AccessResult` but never redirects.

## Example with TanStack Router

```ts
import { createGuard } from '@react-protected/core'
import { createRouter, createRoute, redirect } from '@tanstack/react-router'

const guard = createGuard({
  getUser: () => useAuthStore.getState().user,
  hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
})

const dashboardRoute = createRoute({
  path: '/dashboard',
  beforeLoad: ({ location }) => {
    const result = guard.check({ access: 'authenticated' })
    if (!result.allowed) {
      throw redirect({
        to: result.reason === 'unauthenticated' ? '/login' : '/403',
        search: { next: location.pathname },
      })
    }
  },
  component: DashboardPage,
})
```

## Example with Vanilla JS

```ts
import { createGuard } from '@react-protected/core'

const routeMap: Record<string, { access?: 'public' | 'authenticated'; roles?: string[] }> = {
  '/dashboard': { access: 'authenticated' },
  '/admin': { access: 'authenticated', roles: ['admin'] },
}

const guard = createGuard({
  getUser: () => JSON.parse(sessionStorage.getItem('user') ?? 'null'),
  hasRole: (user, roles) => roles.some((r) => user.roles.includes(r)),
})

function navigate(path: string) {
  const config = routeMap[path] ?? {}
  const result = guard.check(config)

  if (!result.allowed) {
    const redirectTo = result.reason === 'unauthenticated' ? '/login' : '/403'
    history.replaceState(null, '', redirectTo)
    return
  }

  history.pushState(null, '', path)
  renderPage(path)
}
```

## Using @react-protected/react outside React Router

`@react-protected/react` can be used with any routing library that supports a React context pattern:

```tsx
import { AccessProvider, HasAccess, useHasAccess } from '@react-protected/react'

// Wrap your app
const App = () => (
  <AccessProvider
    getUser={() => authStore.user}
    hasRole={(user, roles) => roles.some((r) => user.roles.includes(r))}
    loginPath="/login"
    forbiddenPath="/403"
    defaultPath="/"
  >
    <Router />
  </AccessProvider>
)

// Guard UI elements anywhere in the tree
const AdminPanel = () => (
  <HasAccess roles={['admin']}>
    <button>Manage users</button>
  </HasAccess>
)
```
