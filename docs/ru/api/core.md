# @react-protected/core

Framework-agnostic решения по доступу.

## createGuard(options)

```ts
const guard = createGuard({
  getUser: () => store.getState().user,
  hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
  hasPermission: (user, permissions) =>
    permissions.every((permission) => user.permissions.includes(permission)),
})
```

## guard.check(config)

```ts
const result = guard.check({ access: 'authenticated', roles: ['admin'] })
```

Форма результата:

```ts
type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'unauthenticated' }
  | { allowed: false; reason: 'authenticated' }
  | { allowed: false; reason: 'forbidden' }
```

## Уровни доступа

```ts
type AccessLevel = 'public' | 'authenticated' | 'unauthenticated'
```

- `'public'`: доступ всегда открыт
- `'authenticated'`: нужен залогиненный пользователь
- `'unauthenticated'`: нужен незалогиненный пользователь

Если заданы `roles` или `permissions` без `access`, guard автоматически считает проверку authenticated-only.
