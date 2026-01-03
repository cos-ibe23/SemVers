import { getReasonPhrase } from 'http-status-codes';
import { ApiError } from './api-error';

export { ApiError } from './api-error';

export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(message, {
            statusCode: 401,
            statusPhrase: getReasonPhrase(401),
        });
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(message, {
            statusCode: 403,
            statusPhrase: getReasonPhrase(403),
        });
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends ApiError {
    constructor(message = 'Not found') {
        super(message, {
            statusCode: 404,
            statusPhrase: getReasonPhrase(404),
        });
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends ApiError {
    constructor(message = 'Conflict') {
        super(message, {
            statusCode: 409,
            statusPhrase: getReasonPhrase(409),
        });
        this.name = 'ConflictError';
    }
}

export class UnprocessableError extends ApiError {
    constructor(message = 'Unprocessable entity', errors?: Record<string, string[]>) {
        super(message, {
            statusCode: 422,
            statusPhrase: getReasonPhrase(422),
            errors,
        });
        this.name = 'UnprocessableError';
    }
}

export class BadRequestError extends ApiError {
    constructor(message = 'Bad request') {
        super(message, {
            statusCode: 400,
            statusPhrase: getReasonPhrase(400),
        });
        this.name = 'BadRequestError';
    }
}

export class ServerError extends ApiError {
    constructor(message = 'Internal server error', options?: { metadata?: Record<string, unknown> }) {
        super(message, {
            statusCode: 500,
            statusPhrase: getReasonPhrase(500),
            metadata: options?.metadata,
        });
        this.name = 'ServerError';
    }
}
