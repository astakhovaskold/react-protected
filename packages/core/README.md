# @react-protected/core

Framework-agnostic access-control logic. No dependency on React, a router, or a store.

---

## Installation

```bash
npm install @react-protected/core
```

```bash
yarn add @react-protected/core
```

```bash
pnpm add @react-protected/core
```

## Usage

```ts
import { createGuard } from '@react-protected/core'

const guard = createGuard({
  getUser: () => store.getState().user,
  hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
  hasPermission: (user, permissions) =>
    permissions.every((p) => user.permissions.includes(p)),
})

const result = guard.check({ access: 'authenticated', roles: ['admin'] })

if (result.allowed) {
  // permit access
} else {
  // result.reason: 'unauthenticated' | 'forbidden'
}
```

### Implicit auth requirement

When `roles` or `permissions` are set without an explicit `access` field, the route is treated as `'authenticated'` automatically:

```ts
guard.check({ roles: ['admin'] })
// equivalent to: guard.check({ access: 'authenticated', roles: ['admin'] })
```

## Packages

| Package | Description |
| --- | --- |
| `@react-protected/core` | This package — pure access-control logic |
| `@react-protected/react` | React context, hooks, and `HasAccess` component |
| `@react-protected/react-router` | Adapter for React Router |

## Documentation

- [Core API](https://github.com/astakhovaskold/react-protected/blob/main/docs/en/api/core.md)
- [Examples](https://github.com/astakhovaskold/react-protected/blob/main/docs/en/README.md)
