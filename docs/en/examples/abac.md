# ABAC: Attribute- or Permission-Based Access

ABAC lets you control access through concrete permissions instead of roles.

```ts
type User = {
  id: string
  roles: string[]
  permissions: string[] // ['contracts:read', 'contracts:write', 'users:read']
}
```

```ts
export const router = createGuardedRouter(
  [
    {
      path: '/contracts',
      element: <ContractsPage />,
      access: 'authenticated',
      permissions: ['contracts:read'],
    },
    {
      path: '/contracts/new',
      element: <CreateContractPage />,
      access: 'authenticated',
      permissions: ['contracts:write'],
    },
    {
      path: '/users',
      element: <UsersPage />,
      access: 'authenticated',
      permissions: ['users:read'],
    },
  ],
  {
    getUser: () => useAuthStore.getState().user,
    hasPermission: (user: User, permissions) =>
      permissions.every((permission) => user.permissions.includes(permission)),
    forbiddenPath: '/403',
  }
)
```

## Combining Roles and Permissions

You can use both mechanisms at the same time. The check passes only when both conditions pass:

```ts
{
  path: '/admin/billing',
  access: 'authenticated',
  roles: ['admin'],                // must be admin
  permissions: ['billing:manage'], // and must have billing:manage
}
```
