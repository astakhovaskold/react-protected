# RBAC: Role-Based Access

```ts
// types.ts - your own domain types, the library does not impose a user shape
type User = {
  id: string
  roles: ('admin' | 'manager' | 'viewer')[]
}
```

```ts
// router.ts
export const router = createGuardedRouter(
  [
    { path: '/login', element: <LoginPage />, access: 'guest-only' },
    { path: '/dashboard', element: <DashboardPage />, access: 'authenticated' },
    {
      path: '/admin',
      element: <AdminPage />,
      access: 'authenticated',
      roles: ['admin'], // admin only
    },
    {
      path: '/reports',
      element: <ReportsPage />,
      access: 'authenticated',
      roles: ['admin', 'manager'], // admin or manager
    },
    { path: '/403', element: <Page403 /> },
  ],
  {
    getUser: () => useAuthStore.getState().user,

    // You define the rule: OR, AND, hierarchy, or anything else
    hasRole: (user: User, roles) => roles.some((role) => user.roles.includes(role)),

    loginPath: '/login',
    forbiddenPath: '/403',
  }
)
```

## Role Hierarchy

If your roles are hierarchical, for example `admin` includes `manager` and `manager` includes `viewer`:

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
