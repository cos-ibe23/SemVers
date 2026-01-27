import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import { logger } from '../logger';

export interface ApiErrorOptions {
    statusCode: ContentfulStatusCode;
    statusPhrase: string;
    message: string;
    errors?: Record<string, string[]>;
    metadata?: Record<string, unknown>;
    loggable?: boolean;
}

export class ApiError extends Error {
    public readonly statusCode: ContentfulStatusCode;
    public readonly statusPhrase: string;
    public readonly errors: Record<string, string[]>;
    public readonly metadata: Record<string, unknown>;
    public readonly loggable: boolean;

    constructor(message: string, opts: Partial<ApiErrorOptions> = {}) {
        super(message);
        this.name = 'ApiError';
        // Ensure status code is always a valid number in range 200-599
        const rawStatusCode = opts.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
        this.statusCode = (typeof rawStatusCode === 'number' && rawStatusCode >= 200 && rawStatusCode <= 599
            ? rawStatusCode
            : StatusCodes.INTERNAL_SERVER_ERROR) as ContentfulStatusCode;
        this.statusPhrase = opts.statusPhrase ?? getReasonPhrase(this.statusCode);
        this.errors = opts.errors ?? {};
        this.metadata = opts.metadata ?? {};
        this.loggable = opts.loggable ?? true;
    }

    static parse(error: unknown): ApiError {
        if (error instanceof ApiError) {
            return error;
        }

        if (error instanceof ZodError) {
            const fieldErrors: Record<string, string[]> = {};
            for (const issue of error.issues) {
                const path = issue.path.join('.');
                if (!fieldErrors[path]) {
                    fieldErrors[path] = [];
                }
                fieldErrors[path].push(issue.message);
            }
            return new ApiError('Validation failed', {
                statusCode: 422 as ContentfulStatusCode,
                errors: fieldErrors,
            });
        }

        if (error instanceof Error) {
            return new ApiError(error.message, {
                statusCode: 500 as ContentfulStatusCode,
                metadata: { originalError: error.name },
            });
        }

        return new ApiError('An unexpected error occurred', {
            statusCode: 500 as ContentfulStatusCode,
        });
    }

    log(metadata: Record<string, unknown> = {}) {
        if (!this.loggable) return;
        logger.error({
            error: this.message,
            statusCode: this.statusCode,
            errors: this.errors,
            ...this.metadata,
            ...metadata,
        });
    }

    toResponseError() {
        return {
            error: this.message,
            statusCode: this.statusCode,
            statusPhrase: this.statusPhrase,
            ...(Object.keys(this.errors).length > 0 && { errors: this.errors }),
        };
    }
}
