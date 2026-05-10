# Using the Core Package Without an Adapter

If you are not using React Router, you can still take `@react-protected/core` and plug it into any router.

## Example with TanStack Router

```ts
import { createGuard } from '@react-protected/core'
import { createRouter, createRoute } from '@tanstack/react-router'

const guard = createGuard({
  getUser: () => useAuthStore.getState().user,
  hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
})

const dashboardRoute = createRoute({
  path: '/dashboard',
  beforeLoad: ({ location }) => {
    const result = guard.check(
      { path: '/dashboard', access: 'authenticated' },
      location.pathname
    )
    if (!result.allowed) throw redirect({ to: result.redirectTo })
  },
  component: DashboardPage,
})
```

## Example with Vanilla JS

```ts
import { createGuard } from '@react-protected/core'

const guard = createGuard({
  getUser: () => JSON.parse(sessionStorage.getItem('user') ?? 'null'),
})

// In your navigation handler
window.addEventListener('popstate', () => {
  const result = guard.check(
    routeMap[location.pathname] ?? { path: location.pathname },
    location.pathname
  )
  if (!result.allowed) {
    history.replaceState(null, '', result.redirectTo)
  }
})
```
