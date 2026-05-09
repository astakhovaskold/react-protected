import { RouteObject } from 'react-router-dom';
import { RouteConfig, GuardOptions } from '../../core/src/index.ts';
export type ProtectedRouteObject<TUser = unknown> = Omit<RouteObject, 'children'> & RouteConfig<TUser> & {
    children?: ProtectedRouteObject<TUser>[];
};
export type CreateRouterGuardOptions<TUser = unknown> = GuardOptions<TUser> & {
    loadingElement?: React.ReactNode;
};
