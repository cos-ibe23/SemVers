import { createRoute, z } from '@hono/zod-openapi';
import { authenticated } from '../../../middlewares';
import { jsonContent, jsonApiErrorContent } from '../../../lib/openapi/helpers';

// User schema for responses
const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    emailVerified: z.boolean(),
    image: z.string().nullable(),
    role: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

// Session schema
const sessionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    expiresAt: z.string(),
});

// Profile schema (includes shipper profile data)
const profileSchema = z.object({
    id: z.number(),
    userId: z.string(),
    role: z.string().nullable(),
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
    createdAt: z.string(),
});

// Onboarding request schema
const onboardRequestSchema = z.object({
    role: z.enum(['SHIPPER', 'BUSINESS_OWNER']).default('SHIPPER'),
    businessName: z.string().min(1).max(255),
    logoUrl: z.string().url().max(512).optional(),
    street: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    phoneCountryCode: z.string().max(10).optional(),
    phoneNumber: z.string().max(20).optional(),
});

// Update profile request schema
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

// GET /v1/auth/me - Get current user with profile
export const getMe = createRoute({
    middleware: [authenticated],
    tags: ['v1-auth'],
    method: 'get',
    path: '/auth/me',
    responses: {
        200: jsonContent(
            z.object({
                user: userSchema,
                session: sessionSchema,
                profile: profileSchema.nullable(),
            }),
            'Current user with profile'
        ),
        401: jsonApiErrorContent('Not authenticated'),
    },
});

// GET /v1/auth/profile - Get shipper profile
export const getProfile = createRoute({
    middleware: [authenticated],
    tags: ['v1-auth'],
    method: 'get',
    path: '/auth/profile',
    responses: {
        200: jsonContent(profileSchema, 'Shipper profile'),
        401: jsonApiErrorContent('Not authenticated'),
        404: jsonApiErrorContent('Profile not found - complete onboarding first'),
    },
});

// POST /v1/auth/profile/onboard - Complete onboarding
export const onboardProfile = createRoute({
    middleware: [authenticated],
    tags: ['v1-auth'],
    method: 'post',
    path: '/auth/profile/onboard',
    request: {
        body: jsonContent(onboardRequestSchema, 'Onboarding data'),
    },
    responses: {
        201: jsonContent(profileSchema, 'Profile created'),
        400: jsonApiErrorContent('User already onboarded'),
        401: jsonApiErrorContent('Not authenticated'),
    },
});

// PATCH /v1/auth/profile - Update profile
export const updateProfile = createRoute({
    middleware: [authenticated],
    tags: ['v1-auth'],
    method: 'patch',
    path: '/auth/profile',
    request: {
        body: jsonContent(updateProfileRequestSchema, 'Profile update data'),
    },
    responses: {
        200: jsonContent(profileSchema, 'Updated profile'),
        401: jsonApiErrorContent('Not authenticated'),
        404: jsonApiErrorContent('Profile not found - complete onboarding first'),
    },
});

export type GetMeRoute = typeof getMe;
export type GetProfileRoute = typeof getProfile;
export type OnboardProfileRoute = typeof onboardProfile;
export type UpdateProfileRoute = typeof updateProfile;
