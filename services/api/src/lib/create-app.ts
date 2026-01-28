import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { pinoLogger } from 'hono-pino';
import pino from 'pino';
import { env } from '../env';
import { authenticate, requestScopeMiddleware } from '../middlewares';
import { ApiError } from './errors';
import type { AppBindings, AppOpenAPI } from './types';

// Create a router instance
export function createRouter() {
    return new OpenAPIHono<AppBindings>({
        strict: false,
        defaultHook: (result, c) => {
            if (!result.success) {
                const error = ApiError.parse(result.error);
                return c.json(error.toResponseError(), error.statusCode);
            }
        },
    });
}

/**
 * Check if an origin is allowed based on environment configuration
 */
function isOriginAllowed(origin: string | null): boolean {
    if (!origin) {
        return false; // Reject requests without origin (except for API key requests)
    }

    const allowedOrigins =
        env.NODE_ENV === 'production'
            ? // Production: use ALLOWED_ORIGINS from environment
              (env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [])
            : // Development: allow localhost origins
              [
                  'http://localhost:4000',
                  'http://localhost:3000',
                  'http://127.0.0.1:4000',
                  'http://127.0.0.1:3000',
              ];

    return allowedOrigins.includes(origin);
}

// Create the main app with middleware
export function createApp(): AppOpenAPI {
    const app = createRouter();

    // CORS - restrict to trusted origins only
    app.use(
        '*',
        cors({
            origin: (origin) => {
                // Allow requests without origin if they have API key (handled in app.ts)
                // For CORS preflight, we need to check the origin
                if (!origin) {
                    return null; // CORS will reject, but API key requests bypass CORS
                }
                return isOriginAllowed(origin) ? origin : null;
            },
            allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowHeaders: [
                'Content-Type',
                'Authorization',
                'x-api-key',
                'Cookie',
            ],
            credentials: true,
        })
    );

    // Logging
    app.use(
        '*',
        pinoLogger({
            pino: pino({
                level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
                transport:
                    process.env.NODE_ENV !== 'production'
                        ? { target: 'pino-pretty' }
                        : undefined,
            }),
        })
    );

    // Authentication - extract session for all requests
    app.use('*', authenticate);

    // Request scope - set up context for services
    app.use('*', requestScopeMiddleware);

    // 404 handler
    app.notFound((c) => {
        return c.json(
            {
                error: 'Not found',
                statusCode: 404,
                statusPhrase: 'Not Found',
            },
            404
        );
    });

    // Global error handler
    app.onError((err, c) => {
        const apiError = ApiError.parse(err);
        apiError.log({ path: c.req.path, method: c.req.method });
        return c.json(apiError.toResponseError(), apiError.statusCode);
    });

    return app;
}
