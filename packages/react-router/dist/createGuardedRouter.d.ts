import { RouteObject } from 'react-router-dom';
import { ProtectedRouteObject, CreateRouterGuardOptions } from './types';
export declare function createGuardedRouter<TUser = unknown>(routes: ProtectedRouteObject<TUser>[], options: CreateRouterGuardOptions<TUser>): RouteObject[];
