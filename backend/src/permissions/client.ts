import { UserRoles, Resources, Actions, PermissionConditions, type PermissionConfig } from './types';

/**
 * Client Role Permissions
 *
 * Clients can:
 * - Read/update their own user profile
 * - View their own pickups, items, invoices
 * - Submit pickup requests to shippers
 * - View their notifications
 */
export const clientPermissions: PermissionConfig = {
    name: UserRoles.CLIENT,
    description: 'Client user who receives shipping services',
    permissions: {
        // Users - can only view/update themselves
        [Resources.USERS]: {
            [Actions.READ]: PermissionConditions.IsSelf,
            [Actions.UPDATE]: PermissionConditions.IsSelf,
        },

        // Profiles - can view/update own profile
        [Resources.PROFILES]: {
            [Actions.READ]: PermissionConditions.IsSelf,
            [Actions.UPDATE]: PermissionConditions.IsSelf,
        },

        // Pickups - can view own pickups (where they are the client)
        [Resources.PICKUPS]: {
            [Actions.READ]: PermissionConditions.IsSelf,
            [Actions.LIST]: true, // filtered to own pickups in query
        },

        // Items - can view items in own pickups
        [Resources.ITEMS]: {
            [Actions.READ]: PermissionConditions.IsSelf,
            [Actions.LIST]: true,
        },

        // Boxes - can view boxes containing their items
        [Resources.BOXES]: {
            [Actions.READ]: PermissionConditions.IsSelf,
            [Actions.LIST]: true,
        },

        // Shipments - can view shipments for their boxes
        [Resources.SHIPMENTS]: {
            [Actions.READ]: PermissionConditions.IsSelf,
            [Actions.LIST]: true,
        },

        // Pickup requests - can create and view own requests
        [Resources.PICKUP_REQUESTS]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsSelf,
            [Actions.LIST]: true,
        },

        // Invoices - can view own invoices
        [Resources.INVOICES]: {
            [Actions.READ]: PermissionConditions.IsSelf,
            [Actions.LIST]: true,
        },

        // Notifications - can view own notifications
        [Resources.NOTIFICATIONS]: {
            [Actions.READ]: PermissionConditions.IsSelf,
            [Actions.LIST]: true,
            [Actions.UPDATE]: PermissionConditions.IsSelf, // mark as read
        },
    },
};
