# @react-protected/react

React context, hooks, and `HasAccess` component for [react-protected](https://github.com/astakhovaskold/react-protected).

> **Using React Router?** Install [`@react-protected/react-router`](https://www.npmjs.com/package/@react-protected/react-router) instead — it includes this package.

---

## Installation

```bash
npm install @react-protected/core @react-protected/react
```

```bash
yarn add @react-protected/core @react-protected/react
```

```bash
pnpm add @react-protected/core @react-protected/react
```

## Usage

### AccessProvider

Wrap your app with `AccessProvider` to provide the guard to the component tree:

```tsx
import { AccessProvider } from '@react-protected/react'

const App = () => (
  <AccessProvider
    getUser={() => authStore.user}
    hasRole={(user, roles) => roles.some((role) => user.roles.includes(role))}
    loginPath="/login"
    forbiddenPath="/403"
    defaultPath="/dashboard"
  >
    <Router />
  </AccessProvider>
)
```

### HasAccess

Conditionally render UI elements based on access:

```tsx
import { HasAccess } from '@react-protected/react'

const Toolbar = () => (
  <nav>
    <HasAccess roles={['admin']}>
      <button>Delete</button>
    </HasAccess>
  </nav>
)
```

### useHasAccess

Hook version of `HasAccess`:

```tsx
import { useHasAccess } from '@react-protected/react'

const canDelete = useHasAccess({ roles: ['admin'] })
```

## Packages

| Package | Description |
| --- | --- |
| `@react-protected/core` | Pure access-control logic — no React, no router |
| `@react-protected/react` | This package — React context, hooks, and `HasAccess` |
| `@react-protected/react-router` | Adapter for React Router |

## Documentation

- [Full documentation](https://github.com/astakhovaskold/react-protected/blob/main/docs/en/README.md)
- [Examples](https://github.com/astakhovaskold/react-protected/blob/main/docs/en/examples/basic.md)
