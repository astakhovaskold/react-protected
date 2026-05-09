import { Guard, GuardOptions } from './types';
export declare function createGuard<TUser = unknown>(options: GuardOptions<TUser>): Guard<TUser>;
