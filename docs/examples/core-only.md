# Использование core без адаптера

Если не используешь React Router — можно взять только `@react-protected/core` и встроить в любой роутер.

## Пример с TanStack Router

```ts
import { createGuard } from '@react-protected/core'
import { createRouter, createRoute } from '@tanstack/react-router'

const guard = createGuard({
  getUser: () => useAuthStore.getState().user,
  hasRole: (user, roles) => roles.some((r) => user.roles.includes(r)),
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

## Пример с vanilla JS (без фреймворка)

```ts
import { createGuard } from '@react-protected/core'

const guard = createGuard({
  getUser: () => JSON.parse(sessionStorage.getItem('user') ?? 'null'),
})

// В обработчике навигации
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
