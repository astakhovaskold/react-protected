# @react-protected/react-router

Adapter for React Router data routers and JSX wrappers around regular `Routes`.

## createGuardedRouter(routes, options, routerOptions?)

Takes an array of protected routes and returns a standard React Router router.

```ts
import { createGuardedRouter } from '@react-protected/react-router'

const router = createGuardedRouter(routes, options, {
  basename: '/app',
})
```

### routes

An array of `ProtectedRouteObject`:

```ts
type ProtectedRouteObject = RouteObject & {
  access?: 'public' | 'authenticated' | 'guest-only'
  roles?: string[]
  permissions?: string[]
  meta?: Record<string, unknown>
}
```

Nested routes, `loader`/`action`, layout routes, and `lazy` routes are supported.

### options

All options from `createGuard`.

### routerOptions

Optional third argument. It is forwarded as-is to the second argument of `createBrowserRouter(routes, opts)`.

### Behavior

- UI checks work for `element`, `Component`, layout routes, and lazy routes.
- If access is denied, `loader` and `action` are not executed. A redirect is returned instead using the same rules as `createGuard`.
- If a route defines both static UI and lazy UI, static UI keeps priority.

## JSX API

### GuardProvider

Creates a `guard` from the same options as `createGuard` and places it into React context.

```tsx
<GuardProvider
  getUser={() => authStore.user}
  hasRole={(user, roles) => roles.some((role) => user.roles.includes(role))}
>
  {children}
</GuardProvider>
```

`GuardProvider` is declarative: when its props change, descendants receive a new `guard` with the updated options.

### GuardRoute

Protects a specific route element and renders `<Navigate replace />` when access is denied.

```tsx
<Route
  path="/dashboard"
  element={
    <GuardRoute access="authenticated" permissions={['reports:read']}>
      <DashboardPage />
    </GuardRoute>
  }
/>
```

Its props match the route protection fields:

```ts
type GuardRouteProps = {
  access?: 'public' | 'authenticated' | 'guest-only'
  roles?: string[]
  permissions?: string[]
  meta?: Record<string, unknown>
  children?: ReactNode
}
```

### useGuard

Returns the low-level `guard` from context. Useful when you want a custom access check or custom UI around `guard.check(...)`.

```tsx
const guard = useGuard<User>()
const result = guard.check({ path: '/admin', roles: ['admin'] }, '/admin')
```

Calling it outside `GuardProvider` throws:

```ts
useGuard must be used within <GuardProvider>
```

## callbackUrl

When an unauthenticated user is redirected from a protected route, `callbackUrl` is added automatically:

```
/dashboard → /login?callbackUrl=%2Fdashboard
```

After login, redirecting back is handled by your application:

```ts
const callbackUrl = new URLSearchParams(location.search).get('callbackUrl')
navigate(callbackUrl ?? '/dashboard', { replace: true })
```
