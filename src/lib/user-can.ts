import type { User } from '../db/auth';

// User roles for the Imbod platform
export const UserRoles = {
    ADMIN: 'ADMIN',
    SHIPPER: 'SHIPPER',
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

// Resources that can be accessed
export const Resources = {
    CLIENTS: 'clients',
    PICKUPS: 'pickups',
    ITEMS: 'items',
    BOXES: 'boxes',
    SHIPMENTS: 'shipments',
    PICKUP_REQUESTS: 'pickup_requests',
    FX_RATES: 'fx_rates',
    TEMPLATES: 'templates',
    INVOICES: 'invoices',
    NOTIFICATIONS: 'notifications',
    PROFILE: 'profile',
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
    IsOwner: 'is-owner', // User owns the resource (ownerUserId matches)
    IsAdmin: 'is-admin', // User is an admin
} as const;

export type PermissionCondition = (typeof PermissionConditions)[keyof typeof PermissionConditions];

// Permission value can be true (always allowed), false (never allowed), or a condition
export type PermissionValue = boolean | PermissionCondition | PermissionCondition[];

// Role permission configuration
interface RolePermissions {
    [resource: string]: {
        [action: string]: PermissionValue;
    };
}

// Define permissions for each role
const rolePermissions: Record<UserRole, RolePermissions> = {
    [UserRoles.ADMIN]: {
        // Admin has full access to everything
        '*': { '*': true },
    },
    [UserRoles.SHIPPER]: {
        // Shippers can only access their own resources
        [Resources.CLIENTS]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },
        [Resources.PICKUPS]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },
        [Resources.ITEMS]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },
        [Resources.BOXES]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },
        [Resources.SHIPMENTS]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },
        [Resources.PICKUP_REQUESTS]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },
        [Resources.FX_RATES]: {
            [Actions.CREATE]: true,
            [Actions.READ]: true,
            [Actions.LIST]: true,
        },
        [Resources.TEMPLATES]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.DELETE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },
        [Resources.INVOICES]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },
        [Resources.NOTIFICATIONS]: {
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
            [Actions.LIST]: PermissionConditions.IsOwner,
        },
        [Resources.PROFILE]: {
            [Actions.CREATE]: true,
            [Actions.READ]: PermissionConditions.IsOwner,
            [Actions.UPDATE]: PermissionConditions.IsOwner,
        },
    },
};

export interface ResourceWithOwner {
    ownerUserId?: string;
    userId?: string;
}

/**
 * UserCan - Permission checking class
 *
 * Checks if a user can perform an action on a resource
 */
export class UserCan {
    private user: User | null;
    private userRole: UserRole;

    constructor(user: User | null) {
        this.user = user;
        this.userRole = (user?.role as UserRole) ?? UserRoles.SHIPPER;
    }

    /**
     * Check if user can perform an action on a resource
     */
    public can(
        action: Action,
        resource: Resource,
        resourceInstance?: ResourceWithOwner
    ): boolean {
        if (!this.user) {
            return false;
        }

        const permissions = rolePermissions[this.userRole];
        if (!permissions) {
            return false;
        }

        // Check for wildcard permissions first (admin)
        const wildcardPerms = permissions['*'];
        if (wildcardPerms) {
            const wildcardAction = wildcardPerms['*'];
            if (wildcardAction === true) {
                return true;
            }
        }

        // Check specific resource permissions
        const resourcePerms = permissions[resource];
        if (!resourcePerms) {
            return false;
        }

        const actionPerm = resourcePerms[action];
        if (actionPerm === undefined) {
            return false;
        }

        return this.evaluatePermission(actionPerm, resourceInstance);
    }

    /**
     * Check if user can create a resource
     */
    public canCreate(resource: Resource): boolean {
        return this.can(Actions.CREATE, resource);
    }

    /**
     * Check if user can read a resource
     */
    public canRead(resource: Resource, resourceInstance?: ResourceWithOwner): boolean {
        return this.can(Actions.READ, resource, resourceInstance);
    }

    /**
     * Check if user can update a resource
     */
    public canUpdate(resource: Resource, resourceInstance?: ResourceWithOwner): boolean {
        return this.can(Actions.UPDATE, resource, resourceInstance);
    }

    /**
     * Check if user can delete a resource
     */
    public canDelete(resource: Resource, resourceInstance?: ResourceWithOwner): boolean {
        return this.can(Actions.DELETE, resource, resourceInstance);
    }

    /**
     * Check if user can list resources
     */
    public canList(resource: Resource): boolean {
        return this.can(Actions.LIST, resource);
    }

    /**
     * Get the user ID for ownership checks
     */
    public getUserId(): string | null {
        return this.user?.id ?? null;
    }

    /**
     * Check if user is admin
     */
    public isAdmin(): boolean {
        return this.userRole === UserRoles.ADMIN;
    }

    /**
     * Evaluate a permission value
     */
    private evaluatePermission(
        permission: PermissionValue,
        resourceInstance?: ResourceWithOwner
    ): boolean {
        // Boolean permission
        if (typeof permission === 'boolean') {
            return permission;
        }

        // Single condition
        if (typeof permission === 'string') {
            return this.evaluateCondition(permission, resourceInstance);
        }

        // Array of conditions (any must match)
        if (Array.isArray(permission)) {
            return permission.some(condition =>
                this.evaluateCondition(condition, resourceInstance)
            );
        }

        return false;
    }

    /**
     * Evaluate a permission condition
     */
    private evaluateCondition(
        condition: PermissionCondition,
        resourceInstance?: ResourceWithOwner
    ): boolean {
        switch (condition) {
            case PermissionConditions.IsAdmin:
                return this.isAdmin();

            case PermissionConditions.IsOwner:
                if (!resourceInstance) {
                    // If no resource instance, allow (will be filtered in query)
                    return true;
                }
                const ownerId = resourceInstance.ownerUserId ?? resourceInstance.userId;
                return ownerId === this.user?.id;

            default:
                return false;
        }
    }
}
