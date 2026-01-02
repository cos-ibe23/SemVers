import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppBindings } from '../../src/lib/types';
import type { User } from '../../src/db/auth';
import { createRequestScope, withRequestScope } from '../../src/lib/request-scope';
import { ApiError } from '../../src/lib/errors';

/**
 * Create a test app with mocked authentication and error handling
 */
export function createTestApp() {
    const app = new OpenAPIHono<AppBindings>({
        strict: false,
        defaultHook: (result, c) => {
            if (!result.success) {
                const error = ApiError.parse(result.error);
                return c.json(error.toResponseError(), error.statusCode);
            }
        },
    });

    // Global error handler (same as main app)
    app.onError((err, c) => {
        const apiError = ApiError.parse(err);
        return c.json(apiError.toResponseError(), apiError.statusCode);
    });

    return app;
}

/**
 * Create a mock authentication middleware
 */
export function mockAuthMiddleware(user: User | null) {
    return async (c: any, next: () => Promise<void>) => {
        c.set('authenticatedUser', user);
        c.set('session', user ? {
            id: `session-${user.id}`,
            userId: user.id,
            token: 'mock-token',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ipAddress: '127.0.0.1',
            userAgent: 'test',
            createdAt: new Date(),
            updatedAt: new Date(),
        } : null);

        // Set up request scope
        const scope = createRequestScope({
            authenticatedUser: user,
            requestId: crypto.randomUUID(),
            startedAt: Date.now(),
        });

        return withRequestScope(scope, () => next());
    };
}
