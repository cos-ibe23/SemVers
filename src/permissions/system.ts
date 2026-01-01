import { UserRoles, type PermissionConfig } from './types';

/**
 * System Role Permissions
 *
 * Internal system user for background jobs, seeding, migrations, etc.
 * Has full access like admin but is not a real user.
 * Used when operations need to bypass normal user permissions.
 */
export const systemPermissions: PermissionConfig = {
    name: UserRoles.SYSTEM,
    description: 'Internal system user for background operations',
    permissions: {
        // System has full access to everything
        '*': {
            '*': true,
        },
    },
};
