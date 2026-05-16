# @react-protected/core

Фреймворк-агностик логика контроля доступа. Не зависит от React, роутера или стора.

## createGuard(options)

Создаёт guard, который проверяет доступ на основе текущего пользователя.

```ts
import { createGuard } from '@react-protected/core'

const guard = createGuard({
  getUser: () => store.getState().user,
  hasRole: (user, roles) => roles.some((r) => user.roles.includes(r)),
  hasPermission: (user, permissions) =>
    permissions.every((p) => user.permissions.includes(p)),
})
```

### Options

| Поле              | Тип                              | Default         | Описание                                                 |
| ----------------- | -------------------------------- | --------------- | -------------------------------------------------------- |
| `getUser`         | `() => TUser \| null`            | —               | **Required.** Возвращает текущего пользователя или `null`|
| `isAuthenticated` | `(user) => boolean`              | `user !== null` | Переопределяет проверку аутентификации                   |
| `hasRole`         | `(user, roles) => boolean`       | `() => false`   | Проверка ролей (RBAC)                                    |
| `hasPermission`   | `(user, permissions) => boolean` | `() => false`   | Проверка прав доступа (ABAC)                             |

### Рекомендуемая семантика

Библиотека не навязывает конкретную стратегию сопоставления — семантика полностью определяется твоими реализациями `hasRole` и `hasPermission`. Конвенция, которой следуют все примеры:

| Колбэк            | Стратегия | Обоснование                                                                      |
| ----------------- | --------- | -------------------------------------------------------------------------------- |
| `hasRole`         | OR        | Роли дают альтернативный доступ — `admin` **или** `manager` могут зайти          |
| `hasPermission`   | AND       | Права накапливаются — пользователь должен иметь **каждое** из требуемых          |

```ts
hasRole: (user, roles) => roles.some((r) => user.roles.includes(r))
hasPermission: (user, perms) => perms.every((p) => user.permissions.includes(p))
```

При необходимости можно использовать другую семантику — колбэки полностью под твоим контролем.

Пути для редиректов (`loginPath`, `forbiddenPath`, `defaultPath`) и `callbackUrlParam` не входят в ядро — они живут в `@react-protected/react` (через `AccessProvider`) и `@react-protected/react-router` (через `createAccessRouter`).

## guard.check(config)

Проверяет доступ текущего пользователя к маршруту и возвращает `AccessResult`.

```ts
const result = guard.check({ access: 'authenticated', roles: ['admin'] })

if (result.allowed) {
  // пропустить
} else {
  // result.reason: 'unauthenticated' | 'forbidden'
  console.log(result.reason)
}
```

`check` — чистая функция: читает пользователя через `getUser()` при каждом вызове, побочных эффектов нет.

### Неявное требование аутентификации

Если указаны `roles` или `permissions` без явного `access`, маршрут автоматически считается `'authenticated'`:

```ts
guard.check({ roles: ['admin'] })
// эквивалентно: guard.check({ access: 'authenticated', roles: ['admin'] })
```

## AccessConfig

Объект, передаваемый в `guard.check()`:

```ts
type AccessConfig = {
  access?: AccessLevel   // default: 'public'
  roles?: string[]
  permissions?: string[]
  meta?: Record<string, unknown>
}
```

## AccessLevel

```ts
type AccessLevel = 'public' | 'authenticated'
```

`'guest-only'` — это концепция роутинга, а не контроля доступа. Она определена в адаптере (`@react-protected/react-router`) как `RouterAccessLevel = AccessLevel | 'guest-only'` и обрабатывается до вызова `guard.check()`.

## AccessResult

```ts
type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'unauthenticated' }
  | { allowed: false; reason: 'forbidden' }
```

Целевые пути для редиректов определяются адаптером, а не ядром.

## Guard

Объект, возвращаемый `createGuard`:

```ts
type Guard<TUser = unknown> = {
  check: (config: AccessConfig) => AccessResult
  options: Required<GuardOptions<TUser>>
}
```

`guard.options` открывает доступ к resolved-коллбэкам (с заполненными дефолтами). Адаптеры используют `guard.options.getUser()` и `guard.options.isAuthenticated()` для логики, которую нужно выполнить до вызова `check()` (например, для `guest-only`).
