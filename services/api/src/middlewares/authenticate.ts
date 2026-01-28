import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import { auth } from '../db/auth';
import { db } from '../db';
import { user } from '../db/schema/auth';
import type { AppBindings } from '../lib/types';

// Middleware to extract session from request
// Sets authenticatedUser and session to null if not authenticated
// Fetches full user from database to include role, isSystemUser, etc.
export const authenticate = createMiddleware<AppBindings>(async (c, next) => {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (session) {
        // Fetch full user from database to get all fields (role, isSystemUser, etc.)
        const [fullUser] = await db
            .select()
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1);

        if (fullUser) {
            c.set('authenticatedUser', fullUser);
            c.set('session', session.session);
        } else {
            // User not found in database (shouldn't happen, but handle gracefully)
            c.set('authenticatedUser', null);
            c.set('session', null);
        }
    } else {
        c.set('authenticatedUser', null);
        c.set('session', null);
    }

    await next();
});
