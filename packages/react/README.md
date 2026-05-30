# @react-protected/react

React context, hooks, and `HasAccess` component for `react-protected`.

## Usage

```tsx
import { AccessProvider, HasAccess, useHasAccess } from '@react-protected/react'

const App = () => (
  <AccessProvider
    getUser={() => authStore.user}
    hasRole={(user, roles) => roles.some((role) => user.roles.includes(role))}
  >
    <Toolbar />
  </AccessProvider>
)

const Toolbar = () => {
  const canDelete = useHasAccess({ roles: ['admin'] })

  return (
    <nav>
      <HasAccess roles={['admin']}>
        <button>Delete</button>
      </HasAccess>
      {canDelete ? <button>Danger zone</button> : null}
    </nav>
  )
}
```

`AccessProvider` only provides the guard. It does not store redirect paths or route policy.
