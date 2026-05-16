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
import { createAccessRouter } from '@react-protected/react-router'

export const router = createAccessRouter(
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
      roles: ['admin', 'manager'], // admin ИЛИ manager
    },
    { path: '/403', element: <Page403 /> },
  ],
  {
    getUser: () => useAuthStore.getState().user,

    // Ты сам определяешь логику — здесь OR-семантика
    hasRole: (user: User, roles) => roles.some((r) => user.roles.includes(r)),

    loginPath: '/login',
    forbiddenPath: '/403',
  }
)
```

## Защита UI-элементов

Используй `HasAccess` или `useHasAccess`, чтобы скрывать элементы по ролям — без смены маршрута:

```tsx
import { HasAccess } from '@react-protected/react-router'

const Toolbar = () => (
  <nav>
    <HasAccess roles={['admin']}>
      <button>Удалить пользователя</button>
    </HasAccess>

    <HasAccess roles={['admin', 'manager']}>
      <button>Экспорт отчёта</button>
    </HasAccess>
  </nav>
)
```

## Иерархия ролей

Если у тебя иерархия (admin включает права manager, manager включает права viewer):

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
