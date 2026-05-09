# @react-protected/core

Фреймворк-агностик логика. Не зависит от React, роутера или стора.

## createGuard(options)

Создаёт guard с заданными правилами.

```ts
import { createGuard } from '@react-protected/core'

const guard = createGuard({
  getUser: () => store.getState().user,
  hasRole: (user, roles) => roles.some(r => user.roles.includes(r)),
})
```

### Options

| Поле | Тип | Default | Описание |
|---|---|---|---|
| `getUser` | `() => TUser \| null` | — | **Required.** Возвращает текущего пользователя |
| `isAuthenticated` | `(user) => boolean` | `user !== null` | Считать ли пользователя залогиненным |
| `hasRole` | `(user, roles) => boolean` | `() => false` | Проверка ролей (RBAC) |
| `hasPermission` | `(user, permissions) => boolean` | `() => false` | Проверка прав (ABAC) |
| `loginPath` | `string` | `'/login'` | Куда редиректить незалогиненных |
| `forbiddenPath` | `string` | `'/403'` | Куда редиректить при нехватке прав |
| `defaultPath` | `string` | `'/'` | Куда редиректить залогиненных с `guest-only` |
| `callbackUrlParam` | `string` | `'callbackUrl'` | Имя query-параметра для возврата после логина |

## guard.check(route, currentPath)

Проверяет доступ к маршруту. Возвращает `AccessResult`.

```ts
const result = guard.check(
  { path: '/dashboard', access: 'authenticated', roles: ['admin'] },
  '/dashboard'
)

if (result.allowed) {
  // пускаем
} else {
  // result.reason: 'unauthenticated' | 'forbidden' | 'guest-only'
  // result.redirectTo: строка куда редиректить
  redirect(result.redirectTo)
}
```

## RouteConfig

```ts
type RouteConfig = {
  path: string
  access?: 'public' | 'authenticated' | 'guest-only'  // default: 'public'
  roles?: string[]
  permissions?: string[]
  meta?: Record<string, unknown>
}
```

## AccessResult

```ts
type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'unauthenticated'; redirectTo: string }
  | { allowed: false; reason: 'forbidden';       redirectTo: string }
  | { allowed: false; reason: 'guest-only';      redirectTo: string }
