export * from './types';
export { adminPermissions } from './admin';
export { shipperPermissions } from './shipper';
export { clientPermissions } from './client';
export { systemPermissions } from './system';

import { UserRoles, type PermissionConfig } from './types';
import { adminPermissions } from './admin';
import { shipperPermissions } from './shipper';
import { clientPermissions } from './client';
import { systemPermissions } from './system';

// Map of all role permissions
export const rolePermissions: Record<string, PermissionConfig> = {
    [UserRoles.ADMIN]: adminPermissions,
    [UserRoles.SHIPPER]: shipperPermissions,
    [UserRoles.CLIENT]: clientPermissions,
    [UserRoles.SYSTEM]: systemPermissions,
};

/**
 * Get permission config for a role
 */
export function getPermissionConfig(role: string): PermissionConfig | undefined {
    return rolePermissions[role];
}

/**
 * Check if a role has full access (wildcard permissions)
 */
export function hasFullAccess(role: string): boolean {
    const config = rolePermissions[role];
    if (!config) return false;

    const wildcardPerms = config.permissions['*'];
    return wildcardPerms?.['*'] === true;
}
