# @react-protected/core

Framework-agnostic guard logic. It does not depend on React, a router, or a store.

## createGuard(options)

Creates a guard with the given access rules.

```ts
import { createGuard } from '@react-protected/core'

const guard = createGuard({
  getUser: () => store.getState().user,
  hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
})
```

### Options

| Field              | Type                             | Default         | Description                                                    |
| ------------------ | -------------------------------- | --------------- | -------------------------------------------------------------- |
| `getUser`          | `() => TUser \| null`            | —               | **Required.** Returns the current user                         |
| `isAuthenticated`  | `(user) => boolean`              | `user !== null` | Decides whether the user is considered authenticated           |
| `hasRole`          | `(user, roles) => boolean`       | `() => false`   | Role check for RBAC                                            |
| `hasPermission`    | `(user, permissions) => boolean` | `() => false`   | Permission check for ABAC-style access                         |
| `loginPath`        | `string`                         | `'/login'`      | Redirect target for unauthenticated users                      |
| `forbiddenPath`    | `string`                         | `'/403'`        | Redirect target when the user lacks access                     |
| `defaultPath`      | `string`                         | `'/'`           | Redirect target for authenticated users on `guest-only` routes |
| `callbackUrlParam` | `string`                         | `'callbackUrl'` | Query param name used to return after login                    |

## guard.check(route, currentPath)

Checks access for a route and returns an `AccessResult`.

```ts
const result = guard.check(
  { path: '/dashboard', access: 'authenticated', roles: ['admin'] },
  '/dashboard'
)

if (result.allowed) {
  // allow access
} else {
  // result.reason: 'unauthenticated' | 'forbidden' | 'guest-only'
  // result.redirectTo: the redirect destination
  redirect(result.redirectTo)
}
```

## RouteConfig

```ts
type RouteConfig = {
  path: string
  access?: 'public' | 'authenticated' | 'guest-only' // default: 'public'
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
  | { allowed: false; reason: 'forbidden'; redirectTo: string }
  | { allowed: false; reason: 'guest-only'; redirectTo: string }
```
