<p align="center">
  <img src="./media/logo.png" alt="React Protected" width="980" />
</p>

<p align="center">
  Access decisions for React applications.
</p>

<p align="center">
  RBAC, ABAC, authenticated and unauthenticated route checks without baking app-specific redirect policy into the library.
</p>

<p align="center">
  <a href="./docs/en/README.md">Docs (EN)</a> •
  <a href="./docs/en/api/core.md">Core API</a> •
  <a href="./docs/en/api/react-router.md">React Router API</a> •
  <a href="./CONTRIBUTING.md">Contributing</a> •
  <a href="./LICENSE.md">MIT License</a>
</p>

## Features

- Framework-agnostic core for pure access-control decisions
- React package with `AccessProvider`, `useHasAccess`, and `HasAccess`
- React Router helpers for middleware, loaders, and actions
- Explicit denied handling via `onDenied`
- No built-in `loginPath`, `forbiddenPath`, `defaultPath`, or callback URL policy

## Packages

| Package | Description |
| --- | --- |
| `@react-protected/core` | Pure access-control logic |
| `@react-protected/react` | React context, hooks, and `HasAccess` |
| `@react-protected/react-router` | React Router helpers and `AccessRoute` fallback |

## Quick Start

### Data router

```tsx
import { createBrowserRouter, redirect } from 'react-router-dom'
import {
  createAccessLoader,
  createAccessMiddleware,
} from '@react-protected/react-router'

const accessOptions = {
  getUser: () => authStore.getState().user,
  hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
  hasPermission: (user, permissions) =>
    permissions.every((permission) => user.permissions.includes(permission)),
  onDenied: ({ result, request }) => {
    const url = new URL(request.url)

    switch (result.reason) {
      case 'unauthenticated':
        return redirect(`/login?next=${encodeURIComponent(url.pathname + url.search)}`)
      case 'authenticated':
        return redirect('/dashboard')
      case 'forbidden':
        return redirect('/403')
    }
  },
}

const accessMiddleware = createAccessMiddleware(accessOptions)
const accessLoader = createAccessLoader(accessOptions)

export const router = createBrowserRouter(
  [
    {
      path: '/login',
      middleware: [accessMiddleware({ access: 'unauthenticated' })],
      element: <LoginPage />,
    },
    {
      path: '/dashboard',
      middleware: [accessMiddleware({ access: 'authenticated' })],
      element: <DashboardPage />,
    },
    {
      path: '/reports',
      loader: accessLoader(
        { access: 'authenticated', permissions: ['reports:read'] },
        async () => fetch('/api/reports').then((response) => response.json())
      ),
      element: <ReportsPage />,
    },
    { path: '/403', element: <ForbiddenPage /> },
  ],
  { future: { v8_middleware: true } }
)
```

### Component-level access

```tsx
import { AccessProvider, HasAccess } from '@react-protected/react-router'

function App() {
  return (
    <AccessProvider
      getUser={() => authStore.getState().user}
      hasRole={(user, roles) => roles.some((role) => user.roles.includes(role))}
    >
      <HasAccess roles={['admin']}>
        <button>Delete tenant</button>
      </HasAccess>
    </AccessProvider>
  )
}
```

### `AccessRoute` fallback

```tsx
<AccessRoute
  access="authenticated"
  renderDenied={({ reason }) => {
    if (reason === 'unauthenticated') return <Navigate to="/login" replace />
    if (reason === 'authenticated') return <Navigate to="/dashboard" replace />
    return <Navigate to="/403" replace />
  }}
>
  <DashboardPage />
</AccessRoute>
```
