# @react-protected/react-router

Адаптер для React Router. Включает всё из `@react-protected/react` — устанавливать оба пакета не нужно.

## AccessProvider

Предоставляет guard и конфигурацию навигации дереву React-компонентов. Обязателен для `AccessRoute`, `useAccess`, `useHasAccess` и `HasAccess`.

```tsx
import { AccessProvider } from '@react-protected/react-router'

<AccessProvider
  getUser={() => authStore.user}
  hasRole={(user, roles) => roles.some((role) => user.roles.includes(role))}
  hasPermission={(user, perms) => perms.every((p) => user.permissions.includes(p))}
  loginPath="/login"
  forbiddenPath="/403"
  defaultPath="/dashboard"
  callbackUrlParam="next"
>
  {children}
</AccessProvider>
```

### Props

**Опции guard** (передаются в `createGuard` внутри):

| Prop              | Тип                              | Default         | Описание                                          |
| ----------------- | -------------------------------- | --------------- | ------------------------------------------------- |
| `getUser`         | `() => TUser \| null`            | —               | **Required.** Возвращает текущего пользователя    |
| `isAuthenticated` | `(user) => boolean`              | `user !== null` | Переопределяет проверку аутентификации            |
| `hasRole`         | `(user, roles) => boolean`       | `() => false`   | Проверка ролей (RBAC)                             |
| `hasPermission`   | `(user, perms) => boolean`       | `() => false`   | Проверка прав доступа (ABAC)                      |

**Конфигурация навигации** (используется адаптером для редиректов):

| Prop                    | Тип             | Default      | Описание                                                                                      |
| ----------------------- | --------------- | ------------ | --------------------------------------------------------------------------------------------- |
| `loginPath`             | `string`        | `'/login'`   | Куда перенаправлять незалогиненных пользователей                                              |
| `forbiddenPath`         | `string`        | `'/403'`     | Куда перенаправлять при нехватке прав                                                         |
| `defaultPath`           | `string`        | `'/'`        | Куда перенаправлять залогиненных с `guest-only` маршрутов                                     |
| `callbackUrlParam`      | `string`        | —            | Если указан, добавляет текущий путь как query-параметр при редиректе на логин                 |
| `shouldAddCallbackUrl`  | `() => boolean` | `() => true` | Вызывается при каждом редиректе незалогиненного — решает, добавлять ли callback URL           |

`AccessProvider` декларативный: при изменении props потомки получают новый guard с актуальными опциями.

## AccessRoute

Защищает JSX-элемент маршрута. При запрете отображает `<Navigate replace />`, при разрешении — `children` или `<Outlet />`.

```tsx
import { AccessRoute } from '@react-protected/react-router'

// Паттерн с children
<Route
  path="/dashboard"
  element={
    <AccessRoute access="authenticated" permissions={['reports:read']}>
      <DashboardPage />
    </AccessRoute>
  }
/>

// Паттерн layout (Outlet)
<Route path="/admin" element={<AccessRoute access="authenticated" roles={['admin']} />}>
  <Route index element={<AdminDashboard />} />
  <Route path="users" element={<AdminUsers />} />
</Route>
```

### Props

```ts
type AccessRouteProps = {
  access?: 'public' | 'authenticated' | 'guest-only'
  roles?: string[]
  permissions?: string[]
  meta?: Record<string, unknown>
  children?: ReactNode
}
```

### Поведение редиректов

| Условие                                           | Куда редиректит                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `access: 'guest-only'` + пользователь авторизован | `defaultPath`                                                            |
| `access: 'authenticated'` + не авторизован        | `loginPath` (с `?{callbackUrlParam}=...`, если настроен)                 |
| Проверка роли или права не пройдена               | `forbiddenPath`                                                          |

## createAccessRouter(routes, options, routerOptions?)

Принимает массив защищённых маршрутов и возвращает стандартный React Router router. Guards применяются к `element`, `Component`, `loader`, `action` и `lazy` маршрутам.

```ts
import { createAccessRouter } from '@react-protected/react-router'

const router = createAccessRouter(
  [
    { path: '/', element: <HomePage /> },
    { path: '/login', element: <LoginPage />, access: 'guest-only' },
    {
      path: '/dashboard',
      access: 'authenticated',
      lazy: async () => ({ Component: DashboardPage }),
    },
    {
      path: '/admin',
      access: 'authenticated',
      roles: ['admin'],
      loader: async () => fetchAdminData(),
      element: <AdminPage />,
    },
    { path: '/403', element: <Page403 /> },
  ],
  {
    getUser: () => useAuthStore.getState().user,
    hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
    loginPath: '/login',
    forbiddenPath: '/403',
    defaultPath: '/dashboard',
    callbackUrlParam: 'next',
  },
  { basename: '/app' } // пробрасывается в createBrowserRouter
)
```

### routes — ProtectedRouteObject

Расширение React Router `RouteObject` с полями защиты:

```ts
type ProtectedRouteObject = RouteObject & {
  access?: 'public' | 'authenticated' | 'guest-only'
  roles?: string[]
  permissions?: string[]
  meta?: Record<string, unknown>
  children?: ProtectedRouteObject[]
}
```

### options — CreateAccessRouterConfig

Все props `AccessProvider`, кроме `children`.

### Поведение

- При запрете доступа `loader` и `action` не выполняются — вместо этого возвращается redirect-ответ.
- Если на маршруте есть и статический UI (`element` / `Component`), и `lazy` — приоритет остаётся за статическим UI.

## useAccess()

Возвращает полное значение контекста: guard и конфигурацию навигации.

```tsx
import { useAccess } from '@react-protected/react-router'

const { guard, loginPath, forbiddenPath, defaultPath, callbackUrlParam, shouldAddCallbackUrl } = useAccess<User>()
const result = guard.check({ roles: ['admin'] })
```

Бросает ошибку, если вызван вне `<AccessProvider>`.

## useRouteAccess(config)

Вызывает `guard.check()` и возвращает `AccessResult`. Удобно для кастомной логики редиректов.

```tsx
import { useRouteAccess } from '@react-protected/react-router'

const result = useRouteAccess({ access: 'authenticated', roles: ['admin'] })
// { allowed: boolean, reason?: 'unauthenticated' | 'forbidden' }
```

## useHasAccess(config)

Возвращает `true`, если `guard.check(config).allowed`, иначе `false`. Используй для условного рендеринга UI.

```tsx
import { useHasAccess } from '@react-protected/react-router'

const canDelete = useHasAccess({ roles: ['admin'] })
```

## HasAccess

Компонентная форма `useHasAccess`. Рендерит `children` при разрешении, иначе `null`.

```tsx
import { HasAccess } from '@react-protected/react-router'

<HasAccess roles={['admin']}>
  <button>Удалить</button>
</HasAccess>
```

## Callback URL flow

Если указан `callbackUrlParam`, редирект незалогиненного включает текущий путь:

```
/dashboard?tab=overview → /login?next=%2Fdashboard%3Ftab%3Doverview
```

После логина обработай возврат в страницу логина:

```ts
const [params] = useSearchParams()
const callbackUrl = params.get('next')
navigate(callbackUrl ?? '/dashboard', { replace: true })
```

### Условный callback URL

`shouldAddCallbackUrl` позволяет отключить добавление callback URL в рантайме, не убирая `callbackUrlParam`. Вызывается при каждом редиректе незалогиненного:

```tsx
<AccessProvider
  callbackUrlParam="next"
  shouldAddCallbackUrl={() => !authStore.getState().loggedOut}
  ...
>
```

| Сценарий                         | Результат                                                      |
| -------------------------------- | -------------------------------------------------------------- |
| Сессия истекла (обычный таймаут) | `/login?next=%2Fdashboard` — пользователь вернётся куда шёл   |
| Явный выход из системы           | `/login` — без callback URL, чистый старт                      |

Если `shouldAddCallbackUrl` не передан, callback URL добавляется всегда (поведение не меняется).
