import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { pinoLogger } from 'hono-pino';
import pino from 'pino';
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

// Create the main app with middleware
export function createApp(): AppOpenAPI {
    const app = createRouter();

    // CORS
    app.use(
        '*',
        cors({
            origin: '*', // TODO: Configure allowed origins
            allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowHeaders: ['Content-Type', 'Authorization'],
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
