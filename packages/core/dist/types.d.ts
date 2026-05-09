export type RouteAccess = 'public' | 'authenticated' | 'guest-only';
export type RouteConfig<TUser = unknown> = {
    path: string;
    access?: RouteAccess;
    roles?: string[];
    permissions?: string[];
    meta?: Record<string, unknown>;
};
export type AccessResult = {
    allowed: true;
} | {
    allowed: false;
    reason: 'unauthenticated';
    redirectTo: string;
} | {
    allowed: false;
    reason: 'forbidden';
    redirectTo: string;
} | {
    allowed: false;
    reason: 'guest-only';
    redirectTo: string;
};
export type GuardOptions<TUser = unknown> = {
    getUser: () => TUser | null;
    isAuthenticated?: (user: TUser | null) => boolean;
    hasRole?: (user: TUser, roles: string[]) => boolean;
    hasPermission?: (user: TUser, permissions: string[]) => boolean;
    loginPath?: string;
    forbiddenPath?: string;
    defaultPath?: string;
    callbackUrlParam?: string;
};
export type Guard<TUser = unknown> = {
    check: (route: RouteConfig<TUser>, currentPath: string) => AccessResult;
    options: Required<GuardOptions<TUser>>;
};
