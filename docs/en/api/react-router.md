# @react-protected/react-router

Adapter for React Router. Includes everything from `@react-protected/react` — you do not need to install both packages.

## AccessProvider

Provides the guard and navigation config to the React component tree. Required for `AccessRoute`, `useAccess`, `useHasAccess`, and `HasAccess`.

```tsx
import { AccessProvider } from '@react-protected/react-router'

<AccessProvider
  getUser={() => authStore.user}
  hasRole={(user, roles) => roles.some((role) => user.roles.includes(role))}
  hasPermission={(user, perms) => perms.every((p) => user.permissions.includes(p))}
  loginPath="/login"
  forbiddenPath="/403"
  defaultPath="/dashboard"
  callbackUrlParam="next"
>
  {children}
</AccessProvider>
```

### Props

**Guard options** (passed to `createGuard` internally):

| Prop              | Type                             | Default         | Description                                    |
| ----------------- | -------------------------------- | --------------- | ---------------------------------------------- |
| `getUser`         | `() => TUser \| null`            | —               | **Required.** Returns the current user         |
| `isAuthenticated` | `(user) => boolean`              | `user !== null` | Custom authenticated check                     |
| `hasRole`         | `(user, roles) => boolean`       | `() => false`   | Role check for RBAC                            |
| `hasPermission`   | `(user, perms) => boolean`       | `() => false`   | Permission check for ABAC                      |

**Navigation config** (used by adapters for redirects):

| Prop                    | Type            | Default      | Description                                                                         |
| ----------------------- | --------------- | ------------ | ----------------------------------------------------------------------------------- |
| `loginPath`             | `string`        | `'/login'`   | Where unauthenticated users are redirected                                          |
| `forbiddenPath`         | `string`        | `'/403'`     | Where users without the required role/permission go                                 |
| `defaultPath`           | `string`        | `'/'`        | Where authenticated users go from `guest-only` routes                               |
| `callbackUrlParam`      | `string`        | —            | If set, appends the current path as a query param on login redirect                 |
| `shouldAddCallbackUrl`  | `() => boolean` | `() => true` | Called on each unauthenticated redirect to decide whether to append the callback URL |

`AccessProvider` is declarative: when its props change, descendants receive a fresh guard with updated options.

## AccessRoute

Protects a JSX route element. Renders `<Navigate replace />` when access is denied, `children` or `<Outlet />` when allowed.

```tsx
import { AccessRoute } from '@react-protected/react-router'

// Children pattern
<Route
  path="/dashboard"
  element={
    <AccessRoute access="authenticated" permissions={['reports:read']}>
      <DashboardPage />
    </AccessRoute>
  }
/>

// Layout (Outlet) pattern
<Route path="/admin" element={<AccessRoute access="authenticated" roles={['admin']} />}>
  <Route index element={<AdminDashboard />} />
  <Route path="users" element={<AdminUsers />} />
</Route>
```

### Props

```ts
type AccessRouteProps = {
  access?: 'public' | 'authenticated' | 'guest-only'
  roles?: string[]
  permissions?: string[]
  meta?: Record<string, unknown>
  children?: ReactNode
}
```

### Redirect behavior

| Condition                                   | Redirect target                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| `access: 'guest-only'` + authenticated      | `defaultPath`                                                          |
| `access: 'authenticated'` + not logged in   | `loginPath` (with `?{callbackUrlParam}=...` if configured)             |
| Role or permission check fails              | `forbiddenPath`                                                        |

## createAccessRouter(routes, options, routerOptions?)

Takes an array of protected routes and returns a standard React Router `router`. Guards are applied to `element`, `Component`, `loader`, `action`, and `lazy` routes.

```ts
import { createAccessRouter } from '@react-protected/react-router'

const router = createAccessRouter(
  [
    { path: '/', element: <HomePage /> },
    { path: '/login', element: <LoginPage />, access: 'guest-only' },
    {
      path: '/dashboard',
      access: 'authenticated',
      lazy: async () => ({ Component: DashboardPage }),
    },
    {
      path: '/admin',
      access: 'authenticated',
      roles: ['admin'],
      loader: async () => fetchAdminData(),
      element: <AdminPage />,
    },
    { path: '/403', element: <Page403 /> },
  ],
  {
    getUser: () => useAuthStore.getState().user,
    hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
    loginPath: '/login',
    forbiddenPath: '/403',
    defaultPath: '/dashboard',
    callbackUrlParam: 'next',
  },
  { basename: '/app' } // forwarded to createBrowserRouter
)
```

### routes — ProtectedRouteObject

A superset of React Router's `RouteObject` with access fields:

```ts
type ProtectedRouteObject = RouteObject & {
  access?: 'public' | 'authenticated' | 'guest-only'
  roles?: string[]
  permissions?: string[]
  meta?: Record<string, unknown>
  children?: ProtectedRouteObject[]
}
```

### options — CreateAccessRouterConfig

All `AccessProvider` props except `children`.

### Behavior

- If access is denied, `loader` and `action` are not executed — a redirect response is returned instead.
- If a route has both static UI (`element` / `Component`) and `lazy`, static UI takes priority for rendering; `lazy` loader/action are still wrapped.

## useAccess()

Returns the full context value including the guard and navigation config.

```tsx
import { useAccess } from '@react-protected/react-router'

const { guard, loginPath, forbiddenPath, defaultPath, callbackUrlParam, shouldAddCallbackUrl } = useAccess<User>()
const result = guard.check({ roles: ['admin'] })
```

Throws if called outside `<AccessProvider>`.

## useRouteAccess(config)

Calls `guard.check()` and returns the `AccessResult`. Useful for custom redirect logic.

```tsx
import { useRouteAccess } from '@react-protected/react-router'

const result = useRouteAccess({ access: 'authenticated', roles: ['admin'] })
// { allowed: boolean, reason?: 'unauthenticated' | 'forbidden' }
```

## useHasAccess(config)

Returns `true` if `guard.check(config).allowed`, `false` otherwise. Use this for conditional UI rendering.

```tsx
import { useHasAccess } from '@react-protected/react-router'

const canDelete = useHasAccess({ roles: ['admin'] })
```

## HasAccess

Component version of `useHasAccess`. Renders `children` when access is allowed, `null` otherwise.

```tsx
import { HasAccess } from '@react-protected/react-router'

<HasAccess roles={['admin']}>
  <button>Delete</button>
</HasAccess>
```

## Callback URL flow

When `callbackUrlParam` is set, unauthenticated redirects include the current path:

```
/dashboard?tab=overview → /login?next=%2Fdashboard%3Ftab%3Doverview
```

Handle the return in your login page:

```ts
const [params] = useSearchParams()
const callbackUrl = params.get('next')
navigate(callbackUrl ?? '/dashboard', { replace: true })
```

### Conditional callback URL

`shouldAddCallbackUrl` lets you suppress the callback URL at runtime without removing `callbackUrlParam`. It is called on every unauthenticated redirect:

```tsx
<AccessProvider
  callbackUrlParam="next"
  shouldAddCallbackUrl={() => !authStore.getState().loggedOut}
  ...
>
```

| Scenario                          | Result                                 |
| --------------------------------- | -------------------------------------- |
| Session expired (normal timeout)  | `/login?next=%2Fdashboard` — user returns to where they were |
| User explicitly logged out        | `/login` — no callback URL, clean start |

When `shouldAddCallbackUrl` is not provided, the callback URL is always appended (existing behavior).
