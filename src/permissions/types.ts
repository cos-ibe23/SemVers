import { z } from 'zod';

// User roles for the `user` table (Better Auth managed)
export const UserRoles = {
    ADMIN: 'ADMIN',
    SHIPPER: 'SHIPPER',
    CLIENT: 'CLIENT',
    SYSTEM: 'SYSTEM', // Internal system user for background jobs, seeding, etc.
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

// Zod schema for user roles
export const userRoleSchema = z.enum([
    UserRoles.ADMIN,
    UserRoles.SHIPPER,
    UserRoles.CLIENT,
    UserRoles.SYSTEM,
]);

// Resources that can be accessed
export const Resources = {
    USERS: 'users',
    PROFILES: 'profiles',
    SHIPPER_CLIENTS: 'shipper_clients', // shipper-client relationships
    PICKUPS: 'pickups',
    ITEMS: 'items',
    BOXES: 'boxes',
    SHIPMENTS: 'shipments',
    PICKUP_REQUESTS: 'pickup_requests',
    FX_RATES: 'fx_rates',
    TEMPLATES: 'templates',
    INVOICES: 'invoices',
    NOTIFICATIONS: 'notifications',
    PAYMENT_METHODS: 'payment_methods',
} as const;

export type Resource = (typeof Resources)[keyof typeof Resources];

// Actions that can be performed
export const Actions = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    LIST: 'list',
} as const;

export type Action = (typeof Actions)[keyof typeof Actions];

// Permission conditions
export const PermissionConditions = {
    IsOwner: 'is-owner',         // User owns the resource (ownerUserId/userId matches)
    IsSelf: 'is-self',           // User is accessing their own user record
    IsAdmin: 'is-admin',         // User is an admin
    IsSystem: 'is-system',       // System user (internal operations)
} as const;

export type PermissionCondition = (typeof PermissionConditions)[keyof typeof PermissionConditions];

// Permission value can be true (always allowed), false (never allowed), or a condition
export type PermissionValue = boolean | PermissionCondition | PermissionCondition[];

// Permission configuration for a resource
export interface ResourcePermissions {
    [action: string]: PermissionValue;
}

// Role permission configuration schema
export const permissionConfigSchema = z.object({
    name: z.string(),
    description: z.string(),
    permissions: z.record(z.string(), z.record(z.string(), z.union([
        z.boolean(),
        z.string(),
        z.array(z.string()),
    ]))),
});

export type PermissionConfig = z.infer<typeof permissionConfigSchema>;

// Role permissions map
export interface RolePermissions {
    [resource: string]: ResourcePermissions;
}
