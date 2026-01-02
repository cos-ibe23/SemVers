import { createRoute, z } from '@hono/zod-openapi';
import { authenticated } from '../../../middlewares';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { jsonContent, jsonApiErrorContent } from '../../../lib/openapi/helpers';
import {
    userResponseSchema,
    sessionResponseSchema,
    onboardRequestSchema,
    updateProfileRequestSchema,
} from '../../../db/schema/auth';

// Tag for all auth routes
const TAGS = ['v1-auth'] as const;

// GET /v1/auth/me - Get current user with session
export const getMe = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/auth/me',
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.object({
                user: userResponseSchema,
                session: sessionResponseSchema,
            }),
            'Current user with session'
        ),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('The unauthorized response when not authenticated'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('The not found response when user not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('The internal server error response'),
    },
});

// POST /v1/auth/onboard - Complete shipper onboarding
export const onboard = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/auth/onboard',
    request: {
        body: jsonContent(onboardRequestSchema, 'Onboarding data'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(userResponseSchema, 'User with business fields set'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('The bad request response when already onboarded or not a shipper'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('The unauthorized response when not authenticated'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('The not found response when user not found'),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiErrorContent('The validation error response'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('The internal server error response'),
    },
});

// PATCH /v1/auth/profile - Update user profile/business fields
export const updateProfile = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'patch',
    path: '/auth/profile',
    request: {
        body: jsonContent(updateProfileRequestSchema, 'Profile update data'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(userResponseSchema, 'Updated user'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('The bad request response'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('The unauthorized response when not authenticated'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('The not found response when user not found'),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiErrorContent('The validation error response'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('The internal server error response'),
    },
});

export type GetMeRoute = typeof getMe;
export type OnboardRoute = typeof onboard;
export type UpdateProfileRoute = typeof updateProfile;
