import {
    UserRoles,
    Resources,
    Actions,
    PermissionConditions,
    type PermissionConfig,
} from './types';

/**
 * Shipper Role Permissions
 *
 * Standard user who can manage their own shipping operations.
 * Can create and manage their own clients, pickups, boxes, shipments, etc.
 * Cannot access other users' data.
 */
export const shipperPermissions: PermissionConfig = {
    name: UserRoles.SHIPPER,
    description: 'Standard user who can manage their own shipping operations',
    permissions: {
        // Users - can only read/update self
        [Resources.USERS]: {
            [Actions.READ]: PermissionConditions.IsSelf,
            [Actions.UPDATE]: PermissionConditions.IsSelf,
        },

        // Profiles - can manage own profile
        [Resources.PROFILES]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsSelf,
            [Actions.UPDATE]: PermissionConditions.IsSelf,
        },

        // Shipper Clients - manage relationships with clients
        [Resources.SHIPPER_CLIENTS]: {
            [Actions.CREATE]: true, // add a client
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },

        // Pickups - full CRUD on own pickups
        [Resources.PICKUPS]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },

        // Items - full CRUD on own items
        [Resources.ITEMS]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },

        // Boxes - full CRUD on own boxes
        [Resources.BOXES]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },

        // Shipments - full CRUD on own shipments
        [Resources.SHIPMENTS]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },

        // Pickup Requests - full CRUD on own requests
        [Resources.PICKUP_REQUESTS]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },

        // FX Rates - can create and read (no ownership restriction for reading)
        [Resources.FX_RATES]: {
            [Actions.CREATE]: true,
            [Actions.READ]: true,
            [Actions.LIST]: true,
        },

        // Templates - full CRUD on own templates
        [Resources.TEMPLATES]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },

        // Invoices - can create and read own invoices
        [Resources.INVOICES]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },

        // Notifications - can read/update own notifications
        [Resources.NOTIFICATIONS]: {
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },

        // Payment Methods - full CRUD on own payment methods
        [Resources.PAYMENT_METHODS]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },
    },
};
