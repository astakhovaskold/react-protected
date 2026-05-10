# Basic: Auth and Guest Flow

Minimal example: public pages, a login page for guests only, and a dashboard for authenticated users only.

```ts
// router.ts
import { createGuardedRouter } from '@react-protected/react-router'
import { useAuthStore } from './entities/auth'
import { LoginPage, DashboardPage, HomePage, Page403, Page404 } from './pages'

export const router = createGuardedRouter(
  [
    {
      path: '/',
      element: <HomePage />,
      // access is omitted -> defaults to 'public'
    },
    {
      path: '/login',
      element: <LoginPage />,
      access: 'guest-only', // authenticated users are redirected to defaultPath
    },
    {
      path: '/dashboard',
      element: <DashboardPage />,
      access: 'authenticated', // unauthenticated users are redirected to /login?callbackUrl=%2Fdashboard
    },
    { path: '/403', element: <Page403 /> },
    { path: '*', element: <Page404 /> },
  ],
  {
    getUser: () => useAuthStore.getState().user,
    loginPath: '/login',
    forbiddenPath: '/403',
    defaultPath: '/dashboard',
  }
)
```

```tsx
// App.tsx
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

export const App = () => <RouterProvider router={router} />
```

Alternative for standard JSX routing without `createGuardedRouter`:

```tsx
import { Route, Routes } from 'react-router-dom'
import { GuardProvider, GuardRoute } from '@react-protected/react-router'

export const App = () => (
  <GuardProvider
    getUser={() => useAuthStore.getState().user}
    loginPath="/login"
    forbiddenPath="/403"
    defaultPath="/dashboard"
  >
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={
          <GuardRoute access="guest-only">
            <LoginPage />
          </GuardRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <GuardRoute access="authenticated">
            <DashboardPage />
          </GuardRoute>
        }
      />
    </Routes>
  </GuardProvider>
)
```

```tsx
// pages/LoginPage.tsx - handle callbackUrl after login
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from './entities/auth'

export const LoginPage = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const handleLogin = async (email: string, password: string) => {
    const { user, token } = await AuthAPI.login(email, password)
    setAuth(user, token)
    // callbackUrl is populated automatically
    navigate(params.get('callbackUrl') ?? '/dashboard', { replace: true })
  }

  // ...
}
```
