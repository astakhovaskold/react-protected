# RBAC: Role-Based Access

```ts
const accessMiddleware = createAccessMiddleware({
  getUser: () => useAuthStore.getState().user,
  hasRole: (user, roles) => roles.some((role) => user.roles.includes(role)),
  onDenied: ({ result }) => {
    if (result.reason === 'forbidden') return redirect('/403')
    return redirect('/login')
  },
})
```

```ts
{
  path: '/admin',
  middleware: [accessMiddleware({ access: 'authenticated', roles: ['admin'] })],
  element: <AdminPage />,
}
```
