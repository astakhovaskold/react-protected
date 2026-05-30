# @react-protected/core

Framework-agnostic access decisions.

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

Return shape:

```ts
type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'unauthenticated' }
  | { allowed: false; reason: 'authenticated' }
  | { allowed: false; reason: 'forbidden' }
```

## Access levels

```ts
type AccessLevel = 'public' | 'authenticated' | 'unauthenticated'
```

- `'public'`: always allowed
- `'authenticated'`: requires a logged-in user
- `'unauthenticated'`: requires the absence of a logged-in user

When `roles` or `permissions` are provided without `access`, the guard treats the config as authenticated-only.
