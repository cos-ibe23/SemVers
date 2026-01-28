import type { ZodSchema } from 'zod';
import { z } from 'zod';

// JSON content helper for OpenAPI responses
export function jsonContent<T extends ZodSchema>(schema: T, description: string) {
    return {
        content: {
            'application/json': {
                schema,
            },
        },
        description,
    };
}

// JSON content with required body
export function jsonContentRequired<T extends ZodSchema>(schema: T, description: string) {
    return {
        content: {
            'application/json': {
                schema,
            },
        },
        description,
        required: true,
    };
}

// Standard error response schema
export const apiErrorSchema = z.object({
    error: z.string(),
    statusCode: z.number(),
    statusPhrase: z.string(),
    errors: z.record(z.array(z.string())).optional(),
});

// Error content helper for OpenAPI responses
export function jsonApiErrorContent(description: string) {
    return jsonContent(apiErrorSchema, description);
}

// Pagination schema helper
export function paginatedSchema<T extends ZodSchema>(itemSchema: T) {
    return z.object({
        data: z.array(itemSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        hasMore: z.boolean(),
    });
}

// Common query params for pagination
export const paginationQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

// Common query params with search
export const searchPaginationQuerySchema = paginationQuerySchema.extend({
    search: z.string().optional(),
});
