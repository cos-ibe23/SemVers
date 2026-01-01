import { createMiddleware } from 'hono/factory';
import { UnauthorizedError } from '../lib/errors';
import type { AppBindings } from '../lib/types';

// Middleware that requires authenticated user
// Use this on protected routes
export const authenticated = createMiddleware<AppBindings>(async (c, next) => {
    const user = c.get('authenticatedUser');

    if (!user) {
        throw new UnauthorizedError('Authentication required');
    }

    await next();
});
