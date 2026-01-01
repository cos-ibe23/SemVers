import { createMiddleware } from 'hono/factory';
import { auth } from '../db/auth';
import type { AppBindings } from '../lib/types';

// Middleware to extract session from request
// Sets authenticatedUser and session to null if not authenticated
export const authenticate = createMiddleware<AppBindings>(async (c, next) => {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (session) {
        c.set('authenticatedUser', session.user);
        c.set('session', session.session);
    } else {
        c.set('authenticatedUser', null);
        c.set('session', null);
    }

    await next();
});
