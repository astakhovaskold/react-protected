import { Guard, GuardOptions } from './types';
/**
 * Creates a guard that evaluates access against the current user.
 *
 * @typeParam TUser - User shape returned by `getUser`.
 * @param options - Access callbacks and user accessors used by the guard.
 * @returns A reusable guard with resolved defaults for authentication, role, and permission checks.
 * @remarks When `roles` or `permissions` are provided without `access`, the guard treats the config
 * as authenticated-only.
 */
export declare function createGuard<TUser = unknown>(options: GuardOptions<TUser>): Guard<TUser>;
