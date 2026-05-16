# @react-protected/core

Framework-agnostic access-control logic. No dependency on React, a router, or a store.

## createGuard(options)

Creates a guard that evaluates access based on the current user.

```ts
import { createGuard } from '@react-protected/core'

const guard = createGuard({
  getUser: () => store.getState().user,
  hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
  hasPermission: (user, permissions) =>
    permissions.every((p) => user.permissions.includes(p)),
})
```

### Options

| Field             | Type                             | Default         | Description                                                |
| ----------------- | -------------------------------- | --------------- | ---------------------------------------------------------- |
| `getUser`         | `() => TUser \| null`            | —               | **Required.** Returns the current user or `null`           |
| `isAuthenticated` | `(user) => boolean`              | `user !== null` | Override the default authenticated check                   |
| `hasRole`         | `(user, roles) => boolean`       | `() => false`   | Role check for RBAC                                        |
| `hasPermission`   | `(user, permissions) => boolean` | `() => false`   | Permission check for ABAC-style access                     |

### Recommended semantics

The library does not enforce a specific matching strategy — the semantics are entirely determined by your `hasRole` and `hasPermission` implementations. The convention used across all examples:

| Callback          | Strategy | Rationale                                                                 |
| ----------------- | -------- | ------------------------------------------------------------------------- |
| `hasRole`         | OR       | Roles grant alternative paths — `admin` **or** `manager` may access       |
| `hasPermission`   | AND      | Permissions accumulate — the user must hold **every** required one        |

```ts
hasRole: (user, roles) => roles.some((r) => user.roles.includes(r))
hasPermission: (user, perms) => perms.every((p) => user.permissions.includes(p))
```

You can use different semantics if your domain requires it — the callbacks are yours to define.

Navigation paths (`loginPath`, `forbiddenPath`, `defaultPath`) and `callbackUrlParam` are not part of core — they live in `@react-protected/react` (via `AccessProvider`) and `@react-protected/react-router` (via `createAccessRouter`).

## guard.check(config)

Evaluates whether the current user can access a route and returns an `AccessResult`.

```ts
const result = guard.check({ access: 'authenticated', roles: ['admin'] })

if (result.allowed) {
  // permit access
} else {
  // result.reason: 'unauthenticated' | 'forbidden'
  console.log(result.reason)
}
```

`check` is pure: it reads the user through `getUser()` on every call and has no side effects.

### Implicit auth requirement

When `roles` or `permissions` are set without an explicit `access` field, the route is treated as `'authenticated'` automatically:

```ts
guard.check({ roles: ['admin'] })
// equivalent to: guard.check({ access: 'authenticated', roles: ['admin'] })
```

## AccessConfig

The configuration object passed to `guard.check()`:

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

`'guest-only'` is a routing-layer concern, not an access-control one. It is defined in the adapter (`@react-protected/react-router`) as `RouterAccessLevel = AccessLevel | 'guest-only'` and handled before `guard.check()` is called.

## AccessResult

```ts
type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'unauthenticated' }
  | { allowed: false; reason: 'forbidden' }
```

Redirect targets are determined by the adapter, not by core.

## Guard

The object returned by `createGuard`:

```ts
type Guard<TUser = unknown> = {
  check: (config: AccessConfig) => AccessResult
  options: Required<GuardOptions<TUser>>
}
```

`guard.options` exposes the resolved callbacks (with defaults filled in). Adapters use `guard.options.getUser()` and `guard.options.isAuthenticated()` to implement logic that must be evaluated before `check()` is called (e.g. `guest-only`).
