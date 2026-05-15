# Basic — авторизация и гость

Публичная главная, страница логина только для гостей, дашборд только для авторизованных.

## Data router

```ts
// router.ts
import { createAccessRouter } from '@react-protected/react-router'
import { useAuthStore } from './entities/auth'
import { LoginPage, DashboardPage, HomePage, Page403 } from './pages'

export const router = createAccessRouter(
  [
    { path: '/', element: <HomePage /> },
    {
      path: '/login',
      element: <LoginPage />,
      access: 'guest-only', // залогиненных редиректит на defaultPath
    },
    {
      path: '/dashboard',
      element: <DashboardPage />,
      access: 'authenticated', // незалогиненных → /login?next=%2Fdashboard
    },
    { path: '/403', element: <Page403 /> },
  ],
  {
    getUser: () => useAuthStore.getState().user,
    loginPath: '/login',
    forbiddenPath: '/403',
    defaultPath: '/dashboard',
    callbackUrlParam: 'next',
  }
)
```

```tsx
// App.tsx
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

export const App = () => <RouterProvider router={router} />
```

## JSX-роутинг

```tsx
import { Route, Routes } from 'react-router-dom'
import { AccessProvider, AccessRoute } from '@react-protected/react-router'

export const App = () => (
  <AccessProvider
    getUser={() => useAuthStore.getState().user}
    loginPath="/login"
    forbiddenPath="/403"
    defaultPath="/dashboard"
    callbackUrlParam="next"
  >
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={
          <AccessRoute access="guest-only">
            <LoginPage />
          </AccessRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <AccessRoute access="authenticated">
            <DashboardPage />
          </AccessRoute>
        }
      />
    </Routes>
  </AccessProvider>
)
```

## Обработка callbackUrl после логина

```tsx
// pages/LoginPage.tsx
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from './entities/auth'

export const LoginPage = () => {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const handleLogin = async (email: string, password: string) => {
    const { user, token } = await AuthAPI.login(email, password)
    setAuth(user, token)
    navigate(params.get('next') ?? '/dashboard', { replace: true })
  }

  // ...
}
```
