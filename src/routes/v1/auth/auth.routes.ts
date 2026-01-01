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

export type GetMeRoute = typeof getMe;
