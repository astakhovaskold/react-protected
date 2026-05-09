# react-protected

Framework-agnostic route protection for React applications.

RBAC, ABAC, callbackUrl — без копипасты в каждом проекте.

## Packages

| Package | Description |
|---|---|
| `@react-protected/core` | Чистая логика, без React и без роутера |
| `@react-protected/react-router` | Адаптер для React Router v6 |

## Install

```bash
pnpm add @react-protected/core @react-protected/react-router
```

## Quick Start

```ts
// 1. Создаём guard один раз
import { createGuardedRouter } from '@react-protected/react-router'
import { useAuthStore } from './entities/auth'

const router = createGuardedRouter(
  [
    { path: '/',          element: <HomePage /> },
    { path: '/login',     element: <LoginPage />,     access: 'guest-only' },
    { path: '/dashboard', element: <DashboardPage />, access: 'authenticated' },
    { path: '/admin',     element: <AdminPage />,     access: 'authenticated', roles: ['admin'] },
  ],
  {
    getUser:    () => useAuthStore.getState().user,
    hasRole:    (user, roles) => roles.some(r => user.roles.includes(r)),
    loginPath:  '/login',
    forbiddenPath: '/403',
  }
)

// 2. Используем как обычный router
const App = () => <RouterProvider router={router} />
```

## Motivation

В каждом React-проекте с авторизацией одно и то же:

```tsx
// Это копипастится из проекта в проект
const ProtectedRoute = ({ roles, children }) => {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to={`/login?callbackUrl=${location.pathname}`} />
  if (roles && !roles.some(r => user.roles.includes(r))) return <Navigate to="/403" />
  return children
}
```

`react-protected` решает это один раз.

## Docs

- [Core API](./docs/api/core.md)
- [React Router adapter](./docs/api/react-router.md)
- [Examples](./docs/examples/)

## Author

[@aastakhov](https://github.com/aastakhov)
