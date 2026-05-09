# Basic — авторизация и гость

Минимальный пример: публичные страницы, страница логина только для гостей, дашборд только для авторизованных.

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
      // access не указан → 'public' по умолчанию
    },
    {
      path: '/login',
      element: <LoginPage />,
      access: 'guest-only',   // залогиненных редиректит на defaultPath
    },
    {
      path: '/dashboard',
      element: <DashboardPage />,
      access: 'authenticated', // незалогиненных редиректит на /login?callbackUrl=/dashboard
    },
    { path: '/403', element: <Page403 /> },
    { path: '*',   element: <Page404 /> },
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

```tsx
// pages/LoginPage.tsx — обработка callbackUrl после логина
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from './entities/auth'

export const LoginPage = () => {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const handleLogin = async (email: string, password: string) => {
    const { user, token } = await AuthAPI.login(email, password)
    setAuth(user, token)
    // callbackUrl подхватывается автоматически
    navigate(params.get('callbackUrl') ?? '/dashboard', { replace: true })
  }

  // ...
}
```
