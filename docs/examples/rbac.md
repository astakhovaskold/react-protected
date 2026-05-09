# RBAC — ролевой доступ

```ts
// types.ts — твои типы, библиотека не диктует форму
type User = {
  id: string
  roles: ('admin' | 'manager' | 'viewer')[]
}
```

```ts
// router.ts
export const router = createGuardedRouter(
  [
    { path: '/login',     element: <LoginPage />,     access: 'guest-only' },
    { path: '/dashboard', element: <DashboardPage />, access: 'authenticated' },
    {
      path: '/admin',
      element: <AdminPage />,
      access: 'authenticated',
      roles: ['admin'],           // только admin
    },
    {
      path: '/reports',
      element: <ReportsPage />,
      access: 'authenticated',
      roles: ['admin', 'manager'], // admin или manager
    },
    { path: '/403', element: <Page403 /> },
  ],
  {
    getUser: () => useAuthStore.getState().user,

    // Ты сам определяешь логику — любая OR, AND, иерархия
    hasRole: (user: User, roles) =>
      roles.some((r) => user.roles.includes(r)),

    loginPath: '/login',
    forbiddenPath: '/403',
  }
)
```

## Иерархия ролей

Если у тебя иерархия (admin включает manager, manager включает viewer):

```ts
const HIERARCHY: Record<string, string[]> = {
  admin:   ['admin', 'manager', 'viewer'],
  manager: ['manager', 'viewer'],
  viewer:  ['viewer'],
}

hasRole: (user, roles) =>
  user.roles.some((userRole) =>
    roles.some((required) => HIERARCHY[userRole]?.includes(required))
  )
```
