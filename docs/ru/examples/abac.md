# ABAC — доступ на основе атрибутов

ABAC позволяет задавать доступ через конкретные права (permissions), а не роли.

```ts
type User = {
  id: string
  roles: string[]
  permissions: string[] // ['contracts:read', 'contracts:write', 'users:read']
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

    // AND-семантика: пользователь должен иметь каждое право из списка
    hasPermission: (user: User, permissions) =>
      permissions.every((p) => user.permissions.includes(p)),

    forbiddenPath: '/403',
  }
)
```

## Комбинация ролей и прав

Можно использовать оба механизма одновременно — проверка пройдёт только если выполнены оба условия:

```ts
{
  path: '/admin/billing',
  access: 'authenticated',
  roles: ['admin'],                  // должен быть admin
  permissions: ['billing:manage'],   // И иметь право billing:manage
}
```

## Защита UI-элементов через права

```tsx
import { HasAccess, useHasAccess } from '@react-protected/react-router'

// Компонентная форма
const ContractActions = () => (
  <div>
    <HasAccess permissions={['contracts:write']}>
      <button>Редактировать контракт</button>
    </HasAccess>
  </div>
)

// Хуковая форма
const ExportButton = () => {
  const canExport = useHasAccess({ permissions: ['reports:export'] })
  return canExport ? <button>Экспорт</button> : null
}
```
