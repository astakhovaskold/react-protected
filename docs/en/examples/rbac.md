# RBAC: Role-Based Access

```ts
// types.ts — your own domain types; the library does not impose a user shape
type User = {
  id: string
  roles: ('admin' | 'manager' | 'viewer')[]
}
```

```ts
// router.ts
import { createAccessRouter } from '@react-protected/react-router'

export const router = createAccessRouter(
  [
    { path: '/login', element: <LoginPage />, access: 'guest-only' },
    { path: '/dashboard', element: <DashboardPage />, access: 'authenticated' },
    {
      path: '/admin',
      element: <AdminPage />,
      access: 'authenticated',
      roles: ['admin'],
    },
    {
      path: '/reports',
      element: <ReportsPage />,
      access: 'authenticated',
      roles: ['admin', 'manager'], // admin OR manager
    },
    { path: '/403', element: <Page403 /> },
  ],
  {
    getUser: () => useAuthStore.getState().user,

    // You define the rule: OR semantics here
    hasRole: (user: User, roles) => roles.some((role) => user.roles.includes(role)),

    loginPath: '/login',
    forbiddenPath: '/403',
  }
)
```

## Guarding UI elements

Use `HasAccess` or `useHasAccess` to hide elements based on roles — no route change required:

```tsx
import { HasAccess } from '@react-protected/react-router'

const Toolbar = () => (
  <nav>
    <HasAccess roles={['admin']}>
      <button>Delete user</button>
    </HasAccess>

    <HasAccess roles={['admin', 'manager']}>
      <button>Export report</button>
    </HasAccess>
  </nav>
)
```

## Role hierarchy

If your roles are hierarchical (e.g. `admin` includes `manager` rights):

```ts
const HIERARCHY: Record<string, string[]> = {
  admin: ['admin', 'manager', 'viewer'],
  manager: ['manager', 'viewer'],
  viewer: ['viewer'],
}

hasRole: (user, roles) =>
  user.roles.some((userRole) =>
    roles.some((required) => HIERARCHY[userRole]?.includes(required))
  )
```
