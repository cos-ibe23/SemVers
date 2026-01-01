import type { User } from '../db/auth';
import {
    UserRoles,
    Resources,
    Actions,
    PermissionConditions,
    rolePermissions,
    hasFullAccess,
    type Resource,
    type Action,
    type PermissionCondition,
    type PermissionValue,
} from '../permissions';

// Re-export for convenience
export { UserRoles, Resources, Actions, PermissionConditions };
export type { Resource, Action };

export interface ResourceWithOwner {
    ownerUserId?: string;
    userId?: string;
    id?: string | number;
}

// System user for internal operations
const SYSTEM_USER: User = {
    id: 'system',
    name: 'System',
    email: 'system@internal',
    emailVerified: true,
    image: null,
    role: UserRoles.SYSTEM,
    createdAt: new Date(),
    updatedAt: new Date(),
};

/**
 * UserCan - Permission checking class
 *
 * Checks if a user can perform an action on a resource.
 * Does NOT default to any role - requires explicit user or system context.
 */
export class UserCan {
    private user: User | null;
    private userRole: string | null;

    constructor(user: User | null) {
        this.user = user;
        this.userRole = user?.role ?? null;
    }

    /**
     * Create a UserCan instance with system privileges
     * Use this for background jobs, seeding, migrations, etc.
     */
    static asSystem(): UserCan {
        return new UserCan(SYSTEM_USER);
    }

    /**
     * Check if user can perform an action on a resource
     */
    public can(
        action: Action,
        resource: Resource,
        resourceInstance?: ResourceWithOwner
    ): boolean {
        // No user = no permissions
        if (!this.user || !this.userRole) {
            return false;
        }

        // Check for full access roles (admin, system)
        if (hasFullAccess(this.userRole)) {
            return true;
        }

        // Get permissions for this role
        const config = rolePermissions[this.userRole];
        if (!config) {
            return false;
        }

        // Check specific resource permissions
        const resourcePerms = config.permissions[resource];
        if (!resourcePerms) {
            return false;
        }

        const actionPerm = resourcePerms[action];
        if (actionPerm === undefined) {
            return false;
        }

        return this.evaluatePermission(actionPerm as PermissionValue, resourceInstance);
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
     * Get the user
     */
    public getUser(): User | null {
        return this.user;
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
     * Check if user is a shipper
     */
    public isShipper(): boolean {
        return this.userRole === UserRoles.SHIPPER;
    }

    /**
     * Check if user is a client
     */
    public isClient(): boolean {
        return this.userRole === UserRoles.CLIENT;
    }

    /**
     * Check if this is a system user
     */
    public isSystem(): boolean {
        return this.userRole === UserRoles.SYSTEM;
    }

    /**
     * Check if user has any valid role (is authenticated)
     */
    public isAuthenticated(): boolean {
        return this.user !== null && this.userRole !== null;
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
            return this.evaluateCondition(permission as PermissionCondition, resourceInstance);
        }

        // Array of conditions (any must match)
        if (Array.isArray(permission)) {
            return permission.some(condition =>
                this.evaluateCondition(condition as PermissionCondition, resourceInstance)
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

            case PermissionConditions.IsSystem:
                return this.isSystem();

            case PermissionConditions.IsSelf:
                if (!resourceInstance) {
                    // If no resource instance, allow (will be filtered in query)
                    return true;
                }
                // Check if the resource ID matches the user ID (for user records)
                const resourceUserId = resourceInstance.userId ?? resourceInstance.id;
                return resourceUserId === this.user?.id;

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
