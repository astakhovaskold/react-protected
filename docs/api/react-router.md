# @react-protected/react-router

Адаптер для React Router data routers (`RouterProvider`, `createBrowserRouter`).

## createGuardedRouter(routes, options)

Принимает массив маршрутов с полями защиты и возвращает стандартный React Router router.

```ts
import { createBrowserRouter } from 'react-router-dom'  // не нужен — возвращается готовый
import { createGuardedRouter } from '@react-protected/react-router'

const router = createGuardedRouter(routes, options)
```

### routes

Массив `ProtectedRouteObject` — стандартные `RouteObject` из React Router плюс поля защиты:

```ts
type ProtectedRouteObject = RouteObject & {
  access?: 'public' | 'authenticated' | 'guest-only'
  roles?: string[]
  permissions?: string[]
}
```

Поддерживается вложенность:

```ts
const routes = [
  {
    path: '/app',
    element: <AppLayout />,
    access: 'authenticated',
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'admin',     element: <AdminPage />, roles: ['admin'] },
    ],
  },
]
```

### options

Все опции из `createGuard`.

## callbackUrl

При редиректе незалогиненного пользователя с защищённого маршрута — `callbackUrl` пишется автоматически:

```
/dashboard → /login?callbackUrl=%2Fdashboard
```

После логина — редирект обратно на `/dashboard`. Логику редиректа после логина нужно реализовать самостоятельно:

```ts
const callbackUrl = new URLSearchParams(location.search).get('callbackUrl')
navigate(callbackUrl ?? '/dashboard', { replace: true })
```
