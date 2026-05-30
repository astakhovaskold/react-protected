# ABAC: Permission-Based Access

```ts
const accessLoader = createAccessLoader({
  getUser: () => useAuthStore.getState().user,
  hasPermission: (user, permissions) =>
    permissions.every((permission) => user.permissions.includes(permission)),
  onDenied: ({ result }) => {
    if (result.reason === 'forbidden') return redirect('/403')
    return redirect('/login')
  },
})
```

```ts
{
  path: '/reports',
  loader: accessLoader(
    { access: 'authenticated', permissions: ['reports:read'] },
    async () => fetchReports()
  ),
  element: <ReportsPage />,
}
```
