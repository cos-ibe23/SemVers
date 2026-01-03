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

// Multipart form schema for onboarding (supports file upload)
const onboardMultipartSchema = z.object({
    businessName: z.string().min(1).max(255),
    logoUrl: z.string().url().max(512).optional(),
    logoFile: z.instanceof(File).optional(),
    street: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    phoneCountryCode: z.string().max(10).optional(),
    phoneNumber: z.string().max(20).optional(),
});

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
// Supports both JSON (with logoUrl) and multipart/form-data (with logoFile)
export const onboard = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/auth/onboard',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: onboardRequestSchema,
                },
                'multipart/form-data': {
                    schema: onboardMultipartSchema,
                },
            },
            description: 'Onboarding data. Can send logoUrl (string) or logoFile (file upload)',
            required: true,
        },
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
