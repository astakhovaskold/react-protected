# @react-protected/react-router

React Router helpers for `react-protected`. Includes `@react-protected/react`.

## Usage

### Middleware / loader / action

```tsx
import { createBrowserRouter, redirect } from 'react-router-dom'
import {
  createAccessAction,
  createAccessLoader,
  createAccessMiddleware,
} from '@react-protected/react-router'

const accessOptions = {
  getUser: () => authStore.getState().user,
  hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
  hasPermission: (user, permissions) =>
    permissions.every((permission) => user.permissions.includes(permission)),
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
}

const accessMiddleware = createAccessMiddleware(accessOptions)
const accessLoader = createAccessLoader(accessOptions)
const accessAction = createAccessAction(accessOptions)
```

### `AccessRoute` fallback

```tsx
<AccessRoute
  access="unauthenticated"
  renderDenied={({ reason }) => <div>{reason}</div>}
>
  <LoginPage />
</AccessRoute>
```

The router package decides whether access is allowed and why it was denied. Redirect policy belongs to the application through `onDenied` or `renderDenied`.
