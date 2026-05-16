# ABAC: Attribute- or Permission-Based Access

ABAC lets you control access through concrete permissions rather than broad roles.

```ts
type User = {
  id: string
  roles: string[]
  permissions: string[] // e.g. ['contracts:read', 'contracts:write', 'users:read']
}
```

```ts
import { createAccessRouter } from '@react-protected/react-router'

export const router = createAccessRouter(
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

    // AND semantics: the user must have every permission in the list
    hasPermission: (user: User, permissions) =>
      permissions.every((permission) => user.permissions.includes(permission)),

    forbiddenPath: '/403',
  }
)
```

## Combining roles and permissions

You can use both mechanisms together. Both checks must pass:

```ts
{
  path: '/admin/billing',
  access: 'authenticated',
  roles: ['admin'],                // must be admin
  permissions: ['billing:manage'], // AND must have billing:manage
}
```

## Guarding UI elements with permissions

```tsx
import { HasAccess, useHasAccess } from '@react-protected/react-router'

// Component form
const ContractActions = () => (
  <div>
    <HasAccess permissions={['contracts:write']}>
      <button>Edit contract</button>
    </HasAccess>
  </div>
)

// Hook form
const ExportButton = () => {
  const canExport = useHasAccess({ permissions: ['reports:export'] })
  return canExport ? <button>Export</button> : null
}
```
