# @react-protected/core

Framework-agnostic access-control logic. No dependency on React, a router, or redirect policy.

## Usage

```ts
import { createGuard } from '@react-protected/core'

const guard = createGuard({
  getUser: () => store.getState().user,
  hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
  hasPermission: (user, permissions) =>
    permissions.every((permission) => user.permissions.includes(permission)),
})

const result = guard.check({ access: 'authenticated', roles: ['admin'] })

if (!result.allowed) {
  // result.reason: 'unauthenticated' | 'authenticated' | 'forbidden'
}
```

Supported access levels:

- `'public'`
- `'authenticated'`
- `'unauthenticated'`

When `roles` or `permissions` are set without `access`, the guard treats the config as authenticated-only.
