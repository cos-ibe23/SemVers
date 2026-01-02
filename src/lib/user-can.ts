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

/**
 * UserCan - Permission checking class
 *
 * Checks if a user can perform an action on a resource.
 * Does NOT default to any role - requires explicit user or admin context.
 */
export class UserCan {
    private user: User | null;
    private userRole: string | null;

    constructor(user: User | null) {
        this.user = user;
        this.userRole = user?.role ?? null;
    }

    /**
     * Create a UserCan instance with the real system user from the database.
     * Use this for background jobs, migrations, etc. when you need proper audit trails.
     *
     * The system user must exist in the database (created during initial seeding).
     * Throws NotFoundError if system user doesn't exist.
     *
     * @returns Promise<UserCan> - UserCan instance with real system user
     */
    static async asSystemUser(): Promise<UserCan> {
        // Import dynamically to avoid circular dependency
        const { AuthService } = await import('../services/auth-service');
        const systemUser = await AuthService.getSystemUser();

        // Convert UserResponse to User type for UserCan
        return new UserCan({
            id: systemUser.id,
            name: systemUser.name,
            email: systemUser.email,
            emailVerified: systemUser.emailVerified,
            image: systemUser.image,
            role: systemUser.role,
            isSystemUser: systemUser.isSystemUser,
            createdAt: new Date(systemUser.createdAt),
            updatedAt: new Date(systemUser.updatedAt),
        });
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
     * Check if this is the system user (for internal operations)
     */
    public isSystemUser(): boolean {
        return (this.user as any)?.isSystemUser === true;
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
