<p align="center">
  <img src="./media/logo.png" alt="React Protected" width="980" />
</p>

<p align="center">
  Router-agnostic route protection for React applications.
</p>

<p align="center">
  RBAC, ABAC, guest-only routes and <code>callbackUrl</code> without re-implementing guards in every project.
</p>

<p align="center">
  <a href="./docs/en/README.md">Docs (EN)</a> •
  <a href="./docs/en/api/core.md">Core API</a> •
  <a href="./docs/en/api/react-router.md">React Router API</a> •
  <a href="./CONTRIBUTING.md">Contributing</a> •
  <a href="./LICENSE.md">MIT License</a>
</p>

## Badges

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License: MIT" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&logoColor=white" alt="Tests: Vitest" />
  <img src="https://img.shields.io/badge/package%20manager-pnpm-F69220?logo=pnpm&logoColor=white" alt="Package manager: pnpm" />
  <img src="https://img.shields.io/badge/router-React%20Router-CA4245?logo=reactrouter&logoColor=white" alt="Router: React Router" />
</p>

## Features

- Framework-agnostic core for pure access-control logic (no React, no router)
- Intermediate React package with context, hooks, and UI guard component
- React Router adapter for data routers (`createAccessRouter`) and JSX guards (`AccessRoute`)
- RBAC via `hasRole`, ABAC via `hasPermission`, `guest-only` routes at the adapter level
- Optional `callbackUrlParam` for redirecting users back to the page they tried to visit after login

## Packages

| Package                          | Description                                                              |
| -------------------------------- | ------------------------------------------------------------------------ |
| `@react-protected/core`          | Pure access-control logic — no React, no router, no redirects            |
| `@react-protected/react`         | React context (`AccessProvider`), hooks, and `HasAccess` component       |
| `@react-protected/react-router`  | Adapter for React Router: `createAccessRouter` and `AccessRoute`. Includes everything from `@react-protected/react` |

## Roadmap

- Add a TanStack Router adapter
- Add a Wouter adapter
- Add a `guard` field to route config — a custom function called after all standard checks (auth, roles, permissions), for business logic that cannot be expressed as a role or permission set alone:

  ```ts
  // Redirect to profile setup if email is missing
  {
    path: '/dashboard',
    guard: ({ session }) => {
      if (!session?.user.email) return { redirect: '/profile/setup' }
    },
  }

  // Combine with standard permission check
  {
    path: '/reports',
    permissions: ['reports:read'],
    guard: ({ session }) => {
      if (session?.user.subscriptionExpired) return { redirect: '/subscription/expired' }
    },
  }

  // Route param ownership check
  {
    path: '/users/:userId/edit',
    guard: ({ session, params }) => {
      if (session?.user.role !== 'admin' && params.userId !== session?.user.id) return false
    },
  }
  ```

  Standard checks run first; if they produce a redirect, `guard` is not called. When all standard checks pass, `guard` runs and its result is the final decision (`true` / `false` / `undefined` to pass through / `{ redirect: string }`).  

## Installation

For React Router projects, install the adapter (it includes `@react-protected/react`):

```bash
npm install @react-protected/react-router
```

```bash
yarn add @react-protected/react-router
```

```bash
pnpm add @react-protected/react-router
```

For React projects without React Router:

```bash
npm install @react-protected/react
```

## Quick Start

### Data router (recommended)

```tsx
// router.ts
import { createAccessRouter } from '@react-protected/react-router'
import { useAuthStore } from './entities/auth'

export const router = createAccessRouter(
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
    callbackUrlParam: 'next',
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
    callbackUrlParam="next"
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
import { HasAccess } from '@react-protected/react'

const Toolbar = () => (
  <nav>
    <HasAccess roles={['admin']}>
      <button>Delete</button>
    </HasAccess>
  </nav>
)
```

## Documentation

### Start Here

- [Documentation index](./docs/en/README.md)

### Core

- [Core API](./docs/en/api/core.md)

### React Router Adapter

- [React Router adapter API](./docs/en/api/react-router.md)

### Examples

- [Basic auth and guest flow](./docs/en/examples/basic.md)
- [RBAC example](./docs/en/examples/rbac.md)
- [ABAC example](./docs/en/examples/abac.md)
- [Using the core package without an adapter](./docs/en/examples/core-only.md)

## Contributing

The project aims to keep the API small, predictable, and easy to integrate.

If you want to contribute:

- open an issue with the use case or problem you are solving
- discuss API changes before sending a large PR
- run `pnpm changeset` when your PR changes a published package
- run `pnpm lint`, `pnpm typecheck` and `pnpm test` before submitting changes

## Changelog And Releases

Releases are managed with Changesets.

- add a changeset with `pnpm changeset` whenever a PR changes a published package
- `pnpm version-packages` generates or updates `packages/*/CHANGELOG.md` and bumps package versions
- pushing to `main` triggers [`.github/workflows/release.yml`](./.github/workflows/release.yml), which opens the release PR and publishes to npm

The repository-level overview lives in [CHANGELOG.md](./CHANGELOG.md).

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow.

## License

This project is licensed under the [MIT License](./LICENSE.md).
