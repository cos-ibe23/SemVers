import { getReasonPhrase } from 'http-status-codes';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ApiError } from './api-error';

export { ApiError } from './api-error';

export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(message, {
            statusCode: 401 as ContentfulStatusCode,
            statusPhrase: getReasonPhrase(401),
        });
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(message, {
            statusCode: 403 as ContentfulStatusCode,
            statusPhrase: getReasonPhrase(403),
        });
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends ApiError {
    constructor(message = 'Not found') {
        super(message, {
            statusCode: 404 as ContentfulStatusCode,
            statusPhrase: getReasonPhrase(404),
        });
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends ApiError {
    constructor(message = 'Conflict') {
        super(message, {
            statusCode: 409 as ContentfulStatusCode,
            statusPhrase: getReasonPhrase(409),
        });
        this.name = 'ConflictError';
    }
}

export class UnprocessableError extends ApiError {
    constructor(message = 'Unprocessable entity', errors?: Record<string, string[]>) {
        super(message, {
            statusCode: 422 as ContentfulStatusCode,
            statusPhrase: getReasonPhrase(422),
            errors,
        });
        this.name = 'UnprocessableError';
    }
}

export class BadRequestError extends ApiError {
    constructor(message = 'Bad request') {
        super(message, {
            statusCode: 400 as ContentfulStatusCode,
            statusPhrase: getReasonPhrase(400),
        });
        this.name = 'BadRequestError';
    }
}

export class ServerError extends ApiError {
    constructor(message = 'Internal server error', options?: { metadata?: Record<string, unknown> }) {
        super(message, {
            statusCode: 500 as ContentfulStatusCode,
            statusPhrase: getReasonPhrase(500),
            metadata: options?.metadata,
        });
        this.name = 'ServerError';
    }
}
