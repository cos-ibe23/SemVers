import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { PinoLogger } from 'hono-pino';
import type { User, Session } from '../db/auth';

// App bindings - variables available in context
export type AppBindings = {
    Variables: {
        authenticatedUser: User | null;
        session: Session | null;
        logger: PinoLogger;
    };
};

// Typed Hono app with OpenAPI
export type AppOpenAPI = OpenAPIHono<AppBindings>;

// Typed route handler
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;

// Pagination response type
export type PaginatedResult<T> = {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
};
