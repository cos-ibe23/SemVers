import { createMiddleware } from 'hono/factory';
import { createRequestScope, withRequestScope } from '../lib/request-scope';
import type { AppBindings } from '../lib/types';

/**
 * Middleware to set up request scope for services
 */
export const requestScopeMiddleware = createMiddleware<AppBindings>(async (c, next) => {
    const user = c.get('authenticatedUser');

    const scope = createRequestScope({
        authenticatedUser: user,
        requestId: crypto.randomUUID(),
        startedAt: Date.now(),
    });

    // Run the rest of the request within the scope
    return withRequestScope(scope, () => next());
});
