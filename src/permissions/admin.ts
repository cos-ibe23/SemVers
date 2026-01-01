import { UserRoles, type PermissionConfig } from './types';

/**
 * Admin Role Permissions
 *
 * Full administrator with complete access to all features and data.
 * Can manage users, view all resources, and perform any action.
 */
export const adminPermissions: PermissionConfig = {
    name: UserRoles.ADMIN,
    description: 'Full administrator with complete access to all features and data',
    permissions: {
        // Wildcard - admin has full access to everything
        '*': {
            '*': true,
        },
    },
};
