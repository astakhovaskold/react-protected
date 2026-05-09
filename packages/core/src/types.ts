// Тип доступа к маршруту
export type RouteAccess = 'public' | 'authenticated' | 'guest-only'

// Конфиг одного маршрута
export type RouteConfig<TUser = unknown> = {
  path: string
  access?: RouteAccess          // по умолчанию 'public'
  roles?: string[]              // RBAC: список допустимых ролей
  permissions?: string[]        // ABAC: список допустимых прав
  meta?: Record<string, unknown> // произвольные данные для кастомной логики
}

// Результат проверки доступа
export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'unauthenticated'; redirectTo: string }
  | { allowed: false; reason: 'forbidden';       redirectTo: string }
  | { allowed: false; reason: 'guest-only';      redirectTo: string }

// Опции для createGuard
export type GuardOptions<TUser = unknown> = {
  // Как получить текущего пользователя (синхронно)
  getUser: () => TUser | null

  // Считать ли пользователя аутентифицированным
  isAuthenticated?: (user: TUser | null) => boolean

  // Проверка ролей
  hasRole?: (user: TUser, roles: string[]) => boolean

  // Проверка прав (ABAC)
  hasPermission?: (user: TUser, permissions: string[]) => boolean

  // Куда редиректить если не залогинен (default: '/login')
  loginPath?: string

  // Куда редиректить если залогинен но нет доступа (default: '/403')
  forbiddenPath?: string

  // Куда редиректить залогиненного с guest-only маршрута (default: '/')
  defaultPath?: string

  // Параметр callbackUrl в query string (default: 'callbackUrl')
  callbackUrlParam?: string
}

// Публичный интерфейс guard-а
export type Guard<TUser = unknown> = {
  check: (route: RouteConfig<TUser>, currentPath: string) => AccessResult
  options: Required<GuardOptions<TUser>>
}
