# @react-protected/react-router

Адаптер для React Router data routers и JSX-обёрток над обычным `Routes`.

## createGuardedRouter(routes, options, routerOptions?)

Принимает массив маршрутов с полями защиты и возвращает стандартный React Router router.

```ts
import { createGuardedRouter } from '@react-protected/react-router'

const router = createGuardedRouter(routes, options, {
  basename: '/app',
})
```

### routes

Массив `ProtectedRouteObject`:

```ts
type ProtectedRouteObject = RouteObject & {
  access?: 'public' | 'authenticated' | 'guest-only'
  roles?: string[]
  permissions?: string[]
  meta?: Record<string, unknown>
}
```

Поддерживается вложенность, `loader`/`action`, layout routes и `lazy`.

### options

Все опции из `createGuard`.

### routerOptions

Необязательный третий аргумент. Пробрасывается как есть во второй аргумент `createBrowserRouter(routes, opts)`.

### Поведение

- UI-проверка работает для `element`, `Component`, layout routes и lazy routes.
- Если доступ запрещён, `loader` и `action` не выполняются: вместо этого происходит redirect по тем же правилам, что и в `createGuard`.
- Если на маршруте есть и статический UI, и lazy UI, приоритет остаётся за статическим UI.

## JSX API

### GuardProvider

Создаёт `guard` из тех же опций, что и `createGuard`, и кладёт его в React context.

```tsx
<GuardProvider
  getUser={() => authStore.user}
  hasRole={(user, roles) => roles.some((role) => user.roles.includes(role))}
>
  {children}
</GuardProvider>
```

`GuardProvider` декларативный: если его пропсы меняются, потомки получают новый `guard` с актуальными опциями.

### GuardRoute

Защищает конкретный route element и при отказе делает `<Navigate replace />`.

```tsx
<Route
  path="/dashboard"
  element={
    <GuardRoute access="authenticated" permissions={['reports:read']}>
      <DashboardPage />
    </GuardRoute>
  }
/>
```

Пропсы такие же, как у защиты маршрута:

```ts
type GuardRouteProps = {
  access?: 'public' | 'authenticated' | 'guest-only'
  roles?: string[]
  permissions?: string[]
  meta?: Record<string, unknown>
  children?: ReactNode
}
```

### useGuard

Возвращает низкоуровневый `guard` из context. Полезно, если нужно сделать собственную проверку или построить кастомный UI поверх `guard.check(...)`.

```tsx
const guard = useGuard<User>()
const result = guard.check({ path: '/admin', roles: ['admin'] }, '/admin')
```

Вызов вне `GuardProvider` бросает ошибку:

```ts
useGuard must be used within <GuardProvider>
```

## callbackUrl

При редиректе незалогиненного пользователя с защищённого маршрута `callbackUrl` пишется автоматически:

```
/dashboard → /login?callbackUrl=%2Fdashboard
```

После логина редирект обратно нужно реализовать в приложении:

```ts
const callbackUrl = new URLSearchParams(location.search).get('callbackUrl')
navigate(callbackUrl ?? '/dashboard', { replace: true })
```
