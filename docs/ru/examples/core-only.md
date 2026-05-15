# Использование core без адаптера

Если не используешь React Router — можно взять только `@react-protected/core` и встроить в любой роутер. Guard — чистая функция: возвращает `AccessResult`, но никогда сам не редиректит.

## Пример с TanStack Router

```ts
import { createGuard } from '@react-protected/core'
import { createRouter, createRoute, redirect } from '@tanstack/react-router'

const guard = createGuard({
  getUser: () => useAuthStore.getState().user,
  hasRole: (user, roles) => roles.some((r) => user.roles.includes(r)),
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

## Пример с vanilla JS

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

## Использование @react-protected/react без React Router

`@react-protected/react` работает с любой библиотекой роутинга через паттерн React context:

```tsx
import { AccessProvider, HasAccess, useHasAccess } from '@react-protected/react'

// Оборачиваем приложение
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

// Защищаем UI-элементы в любом месте дерева
const AdminPanel = () => (
  <HasAccess roles={['admin']}>
    <button>Управление пользователями</button>
  </HasAccess>
)
```
