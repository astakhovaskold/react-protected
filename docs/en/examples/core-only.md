# Using the Core Package Without an Adapter

```ts
const guard = createGuard({
  getUser: () => authStore.getState().user,
  hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
})

const result = guard.check({ access: 'authenticated', roles: ['admin'] })

if (!result.allowed) {
  if (result.reason === 'unauthenticated') redirect('/login')
  if (result.reason === 'authenticated') redirect('/dashboard')
  if (result.reason === 'forbidden') redirect('/403')
}
```
