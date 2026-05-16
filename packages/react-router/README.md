# @react-protected/react-router

React Router adapter for [react-protected](https://github.com/astakhovaskold/react-protected). Includes `@react-protected/react` — no need to install both.

---

## Installation

```bash
npm install @react-protected/react-router
```

```bash
yarn add @react-protected/react-router
```

```bash
pnpm add @react-protected/react-router
```

## Usage

### Data router (recommended)

```tsx
import { createAccessRouter } from '@react-protected/react-router'
import { useAuthStore } from './entities/auth'

const router = createAccessRouter(
  [
    { path: '/', element: <HomePage /> },
    { path: '/login', element: <LoginPage />, access: 'guest-only' },
    { path: '/dashboard', element: <DashboardPage />, access: 'authenticated' },
    { path: '/admin', element: <AdminPage />, access: 'authenticated', roles: ['admin'] },
    { path: '/403', element: <Page403 /> },
  ],
  {
    getUser: () => useAuthStore.getState().user,
    hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
    loginPath: '/login',
    forbiddenPath: '/403',
    defaultPath: '/dashboard',
  }
)

// App.tsx
import { RouterProvider } from 'react-router-dom'
export const App = () => <RouterProvider router={router} />
```

### JSX routes

```tsx
import { Route, Routes } from 'react-router-dom'
import { AccessProvider, AccessRoute } from '@react-protected/react-router'

const App = () => (
  <AccessProvider
    getUser={() => useAuthStore.getState().user}
    hasRole={(user, roles) => roles.some((role) => user.roles.includes(role))}
    loginPath="/login"
    forbiddenPath="/403"
    defaultPath="/dashboard"
  >
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={
          <AccessRoute access="guest-only">
            <LoginPage />
          </AccessRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <AccessRoute access="authenticated">
            <DashboardPage />
          </AccessRoute>
        }
      />
    </Routes>
  </AccessProvider>
)
```

### Guarding UI elements

```tsx
import { HasAccess } from '@react-protected/react-router'

const Toolbar = () => (
  <nav>
    <HasAccess roles={['admin']}>
      <button>Delete</button>
    </HasAccess>
  </nav>
)
```

## Packages

| Package | Description |
| --- | --- |
| `@react-protected/core` | Pure access-control logic — no React, no router |
| `@react-protected/react` | React context, hooks, and `HasAccess` component |
| `@react-protected/react-router` | This package — adapter for React Router |

## Documentation

- [React Router API](https://github.com/astakhovaskold/react-protected/blob/main/docs/en/api/react-router.md)
- [Examples](https://github.com/astakhovaskold/react-protected/blob/main/docs/en/README.md)
