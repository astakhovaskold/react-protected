# @react-protected/react-router

Helpers для React Router поверх общего guard.

## createAccessMiddleware(options)

```tsx
const accessMiddleware = createAccessMiddleware({
  getUser,
  hasRole,
  hasPermission,
  onDenied: ({ result, request }) => {
    const url = new URL(request.url)

    switch (result.reason) {
      case 'unauthenticated':
        return redirect(`/login?next=${encodeURIComponent(url.pathname + url.search)}`)
      case 'authenticated':
        return redirect('/dashboard')
      case 'forbidden':
        return redirect('/403')
    }
  },
})
```

## createAccessLoader(options)

```tsx
const accessLoader = createAccessLoader({
  getUser,
  hasPermission,
  onDenied: ({ result }) => {
    if (result.reason === 'forbidden') return redirect('/403')
    return redirect('/login')
  },
})
```

## createAccessAction(options)

Тот же контракт, что и у `createAccessLoader`, но для action.

## AccessRoute

Render-time fallback. Сам по себе не редиректит:

```tsx
<AccessRoute
  access="authenticated"
  renderDenied={({ reason }) => <div>{reason}</div>}
>
  <DashboardPage />
</AccessRoute>
```

## Route decision

```ts
type RouteAccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'unauthenticated' | 'authenticated' | 'forbidden' }
```

## Конфиг маршрута

```ts
type RouterRouteConfig = {
  access?: 'public' | 'authenticated' | 'unauthenticated'
  roles?: string[]
  permissions?: string[]
  meta?: Record<string, unknown>
}
```
