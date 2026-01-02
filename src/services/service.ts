import type { Context } from 'hono';
import { db } from '../db';
import type { User } from '../db/auth';
import { ApiError } from '../lib/errors';
import { logger } from '../lib/logger';
import { getRequestScope } from '../lib/request-scope';
import { UserCan } from '../lib/user-can';

export interface ServiceOptions {
    context?: Context;
    user?: User | null;
}

/**
 * Base Service class
 *
 * Provides:
 * - Access to UserCan for permission checking
 * - Database access
 * - Request scope integration
 */
export class Service {
    protected _context?: Context;
    protected _user: User | null;
    protected _userCan: UserCan;

    constructor(options: ServiceOptions = {}) {
        // Try to get user from options, context, or request scope
        const scope = getRequestScope();

        if (options.user !== undefined) {
            this._user = options.user;
        } else if (options.context) {
            this._user = options.context.get('authenticatedUser') ?? null;
        } else if (scope) {
            this._user = scope.authenticatedUser;
        } else {
            this._user = null;
        }

        this._context = options.context;
        this._userCan = new UserCan(this._user);
    }

    /**
     * Get the current user
     */
    public get user(): User | null {
        return this._user;
    }

    /**
     * Get the UserCan instance for permission checking
     */
    public get userCan(): UserCan {
        return this._userCan;
    }

    /**
     * Get the Hono context
     */
    public get context(): Context | undefined {
        return this._context;
    }

    /**
     * Get the database instance
     */
    public get db() {
        return db;
    }

    /**
     * Get the current user's ID
     * Throws if not authenticated
     */
    protected requireUserId(): string {
        const userId = this._user?.id;
        if (!userId) {
            throw new ApiError('Authentication required', { statusCode: 401 });
        }
        return userId;
    }

    /**
     * Log service activity
     */
    protected log(
        event: string,
        data: Record<string, unknown> = {},
        level: 'info' | 'warn' | 'error' = 'info'
    ) {
        const scope = getRequestScope();
        const logData = {
            event,
            requestId: scope?.requestId,
            userId: this._user?.id,
            timestamp: new Date().toISOString(),
            ...data,
        };

        logger[level](logData, event);
    }
}
