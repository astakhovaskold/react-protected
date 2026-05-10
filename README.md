<p align="center">
  <img src="./media/logo.png" alt="React Protected" width="980" />
</p>

<p align="center">
  Router-agnostic route protection for React applications.
</p>

<p align="center">
  RBAC, ABAC and <code>callbackUrl</code> without re-implementing guards in every project.
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

- Framework-agnostic core for access checks and redirects
- React Router adapter for data routers and JSX guards
- Support for `guest-only`, `authenticated`, RBAC and ABAC scenarios
- Built-in `callbackUrl` flow for returning users after login
- Monorepo with TypeScript, Vitest and package-level builds

## Packages

| Package                         | Description                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `@react-protected/core`         | Pure access-control logic without React or router bindings                           |
| `@react-protected/react-router` | Adapter for React Router data routers and JSX guards (`GuardProvider`, `GuardRoute`) |

## Roadmap

- Add a `TanStack Router` adapter later
- Add a `Wouter` adapter later

## Installation

```bash
npm install @react-protected/core @react-protected/react-router
```

```bash
yarn add @react-protected/core @react-protected/react-router
```

```bash
pnpm add @react-protected/core @react-protected/react-router
```

```bash
bun add @react-protected/core @react-protected/react-router
```

## Quick Start

```tsx
import { RouterProvider } from 'react-router-dom'
import { createGuardedRouter } from '@react-protected/react-router'
import { useAuthStore } from './entities/auth'

const router = createGuardedRouter(
  [
    { path: '/', element: <HomePage /> },
    { path: '/login', element: <LoginPage />, access: 'guest-only' },
    { path: '/dashboard', element: <DashboardPage />, access: 'authenticated' },
    { path: '/admin', element: <AdminPage />, access: 'authenticated', roles: ['admin'] },
  ],
  {
    getUser: () => useAuthStore.getState().user,
    hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
    loginPath: '/login',
    forbiddenPath: '/403',
  }
)

const App = () => <RouterProvider router={router} />
```

If your routes are already built with `<Routes>`, use the JSX API:

```tsx
import { Route, Routes } from 'react-router-dom'
import { GuardProvider, GuardRoute } from '@react-protected/react-router'

const App = () => (
  <GuardProvider
    getUser={() => useAuthStore.getState().user}
    hasRole={(user, roles) => roles.some((role) => user.roles.includes(role))}
    loginPath="/login"
    forbiddenPath="/403"
  >
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/dashboard"
        element={
          <GuardRoute access="authenticated">
            <DashboardPage />
          </GuardRoute>
        }
      />
    </Routes>
  </GuardProvider>
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

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow.

## License

This project is licensed under the [MIT License](./LICENSE.md).
