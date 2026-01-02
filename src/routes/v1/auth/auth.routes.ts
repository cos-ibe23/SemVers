import { createRoute, z } from '@hono/zod-openapi';
import { authenticated } from '../../../middlewares';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { jsonContent, jsonApiErrorContent } from '../../../lib/openapi/helpers';

// User schema for responses (includes business fields)
const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    emailVerified: z.boolean(),
    image: z.string().nullable(),
    role: z.string(),
    isSystemUser: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    businessName: z.string().nullable(),
    logoUrl: z.string().nullable(),
    street: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    phoneCountryCode: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    requestSlug: z.string().nullable(),
    onboardedAt: z.string().nullable(),
});

// Session schema
const sessionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    expiresAt: z.string(),
});

// Onboarding request schema (shippers only)
const onboardRequestSchema = z.object({
    businessName: z.string().min(1).max(255),
    logoUrl: z.string().url().max(512).optional(),
    street: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    phoneCountryCode: z.string().max(10).optional(),
    phoneNumber: z.string().max(20).optional(),
});

// Update profile request schema (any user)
const updateProfileRequestSchema = z.object({
    businessName: z.string().min(1).max(255).optional(),
    logoUrl: z.string().url().max(512).optional().nullable(),
    street: z.string().max(255).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    country: z.string().max(100).optional().nullable(),
    phoneCountryCode: z.string().max(10).optional().nullable(),
    phoneNumber: z.string().max(20).optional().nullable(),
});

// GET /v1/auth/me - Get current user with session
export const getMe = createRoute({
    middleware: [authenticated],
    tags: ['v1-auth'],
    method: 'get',
    path: '/auth/me',
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.object({
                user: userSchema,
                session: sessionSchema,
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
    tags: ['v1-auth'],
    method: 'post',
    path: '/auth/onboard',
    request: {
        body: jsonContent(onboardRequestSchema, 'Onboarding data'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(userSchema, 'User with business fields set'),
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
    tags: ['v1-auth'],
    method: 'patch',
    path: '/auth/profile',
    request: {
        body: jsonContent(updateProfileRequestSchema, 'Profile update data'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(userSchema, 'Updated user'),
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
