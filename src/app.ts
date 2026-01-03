import { createApp } from './lib/create-app';
import { configureOpenAPI } from './lib/configure-open-api';
import { auth } from './db/auth';
import { env } from './env';
import { logger } from './lib/logger';

// Routes
import indexRouter from './routes/index.route';
import v1IndexRouter from './routes/v1/index.route';
import v1AuthRouter from './routes/v1/auth/auth.index';
import v1ClientsRouter from './routes/v1/shipper-clients/shipper-clients.index';

// Create app with middleware
const app = createApp();

// Configure OpenAPI docs
configureOpenAPI(app);

// Helper function to create a request with Origin header added
function addOriginHeader(request: Request, origin: string): Request {
    const headers = new Headers(request.headers);
    headers.set('origin', origin);

    // For requests with body (POST, PUT, etc.), we need to handle it carefully
    // Since we haven't read the body yet, we can pass it directly
    const init: RequestInit = {
        method: request.method,
        headers,
    };

    // Only include body for methods that typically have one
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
        init.body = request.body;
    }

    return new Request(request.url, init);
}

// Mount Better Auth routes with Origin handling
app.on(['POST', 'GET', 'PATCH'], '/v1/auth/*', async (c, next) => {
    const path = c.req.path;

    // Skip custom routes - these are handled by the custom auth router
    const customRoutes = ['/v1/auth/me', '/v1/auth/onboard', '/v1/auth/profile'];
    if (customRoutes.includes(path)) {
        // Let the request fall through to the custom routes
        return next();
    }

    // Handle Better Auth built-in routes (sign-in, sign-up, sign-out, session, etc.)
    const request = c.req.raw;
    const origin = request.headers.get('origin');

    // In production, allow requests without Origin if they have a valid API key
    // (for mobile apps or server-to-server API clients)
    if (env.NODE_ENV === 'production' && !origin) {
        const apiKey = request.headers.get('x-api-key');

        // Only allow if valid API key is provided (removed user agent check for security)
        if (apiKey && env.MOBILE_API_KEY && apiKey === env.MOBILE_API_KEY) {
            // Log API key usage for security monitoring
            logger.info(
                {
                    path,
                    method: request.method,
                    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
                },
                'API key authentication used for Better Auth request'
            );

            const modifiedRequest = addOriginHeader(request, env.BETTER_AUTH_URL);
            return auth.handler(modifiedRequest);
        }

        // Reject requests without Origin and without valid API key
        logger.warn(
            {
                path,
                method: request.method,
                ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
            },
            'Better Auth request rejected: missing Origin header and invalid/missing API key'
        );
    }

    // In development, inject Origin if missing (for API testing tools like Bruno)
    if (env.NODE_ENV !== 'production' && !origin) {
        const modifiedRequest = addOriginHeader(
            request,
            env.BETTER_AUTH_URL || 'http://localhost:4000'
        );
        return auth.handler(modifiedRequest);
    }

    return auth.handler(request);
});

// Mount non-versioned routes
app.route('/', indexRouter);

// Mount v1 routes
app.route('/v1', v1IndexRouter);
app.route('/v1', v1AuthRouter);
app.route('/v1', v1ClientsRouter);

export default app;
