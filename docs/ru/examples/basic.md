# Basic: Auth and Unauth Flow

```ts
const accessMiddleware = createAccessMiddleware({
  getUser: () => useAuthStore.getState().user,
  onDenied: ({ result }) => {
    switch (result.reason) {
      case 'unauthenticated':
        return redirect('/login')
      case 'authenticated':
        return redirect('/dashboard')
      case 'forbidden':
        return redirect('/403')
    }
  },
})
```

```ts
const router = createBrowserRouter(
  [
    { path: '/', element: <HomePage /> },
    {
      path: '/login',
      middleware: [accessMiddleware({ access: 'unauthenticated' })],
      element: <LoginPage />,
    },
    {
      path: '/dashboard',
      middleware: [accessMiddleware({ access: 'authenticated' })],
      element: <DashboardPage />,
    },
  ],
  { future: { v8_middleware: true } }
)
```
