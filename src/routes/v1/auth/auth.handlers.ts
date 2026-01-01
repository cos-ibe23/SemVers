import { eq } from 'drizzle-orm';
import slugify from 'slugify';
import { db } from '../../../db';
import { shipperProfiles } from '../../../db/schema';
import { NotFoundError, BadRequestError } from '../../../lib/errors';
import type { AppRouteHandler } from '../../../lib/types';
import type { GetMeRoute, GetProfileRoute, OnboardProfileRoute, UpdateProfileRoute } from './auth.routes';

// Helper to serialize profile to response format
function serializeProfile(profile: typeof shipperProfiles.$inferSelect) {
    return {
        id: profile.id,
        userId: profile.userId,
        role: profile.role,
        businessName: profile.businessName,
        logoUrl: profile.logoUrl,
        street: profile.street,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        phoneCountryCode: profile.phoneCountryCode,
        phoneNumber: profile.phoneNumber,
        requestSlug: profile.requestSlug,
        onboardedAt: profile.onboardedAt?.toISOString() ?? null,
        createdAt: profile.createdAt.toISOString(),
    };
}

// Generate unique request slug from business name
async function generateUniqueSlug(businessName: string): Promise<string> {
    const baseSlug = slugify(businessName, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await db
            .select({ id: shipperProfiles.id })
            .from(shipperProfiles)
            .where(eq(shipperProfiles.requestSlug, slug))
            .limit(1);

        if (existing.length === 0) {
            return slug;
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
}

// GET /v1/auth/me - Get current user with profile
export const getMe: AppRouteHandler<GetMeRoute> = async (c) => {
    const user = c.get('authenticatedUser')!;
    const session = c.get('session')!;

    // Fetch shipper profile if exists
    const profiles = await db
        .select()
        .from(shipperProfiles)
        .where(eq(shipperProfiles.userId, user.id))
        .limit(1);

    const profile = profiles[0] ?? null;

    return c.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image ?? null,
            role: user.role ?? 'SHIPPER',
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        },
        session: {
            id: session.id,
            userId: session.userId,
            expiresAt: session.expiresAt.toISOString(),
        },
        profile: profile ? serializeProfile(profile) : null,
    }, 200);
};

// GET /v1/auth/profile - Get shipper profile
export const getProfile: AppRouteHandler<GetProfileRoute> = async (c) => {
    const user = c.get('authenticatedUser')!;

    const profiles = await db
        .select()
        .from(shipperProfiles)
        .where(eq(shipperProfiles.userId, user.id))
        .limit(1);

    const profile = profiles[0];
    if (!profile) {
        throw new NotFoundError('Profile not found - complete onboarding first');
    }

    return c.json(serializeProfile(profile), 200);
};

// POST /v1/auth/profile/onboard - Complete onboarding
export const onboardProfile: AppRouteHandler<OnboardProfileRoute> = async (c) => {
    const user = c.get('authenticatedUser')!;
    const body = c.req.valid('json');

    // Check if already onboarded
    const existing = await db
        .select({ id: shipperProfiles.id })
        .from(shipperProfiles)
        .where(eq(shipperProfiles.userId, user.id))
        .limit(1);

    if (existing.length > 0) {
        throw new BadRequestError('User already onboarded');
    }

    // Generate unique slug from business name
    const requestSlug = await generateUniqueSlug(body.businessName);

    // Create profile
    const [profile] = await db
        .insert(shipperProfiles)
        .values({
            userId: user.id,
            role: body.role,
            businessName: body.businessName,
            logoUrl: body.logoUrl ?? null,
            street: body.street ?? null,
            city: body.city ?? null,
            state: body.state ?? null,
            country: body.country ?? null,
            phoneCountryCode: body.phoneCountryCode ?? null,
            phoneNumber: body.phoneNumber ?? null,
            requestSlug,
            onboardedAt: new Date(),
        })
        .returning();

    return c.json(serializeProfile(profile), 201);
};

// PATCH /v1/auth/profile - Update profile
export const updateProfile: AppRouteHandler<UpdateProfileRoute> = async (c) => {
    const user = c.get('authenticatedUser')!;
    const body = c.req.valid('json');

    // Check profile exists
    const existing = await db
        .select()
        .from(shipperProfiles)
        .where(eq(shipperProfiles.userId, user.id))
        .limit(1);

    if (existing.length === 0) {
        throw new NotFoundError('Profile not found - complete onboarding first');
    }

    // Update profile
    const [profile] = await db
        .update(shipperProfiles)
        .set({
            businessName: body.businessName ?? existing[0].businessName,
            logoUrl: body.logoUrl !== undefined ? body.logoUrl : existing[0].logoUrl,
            street: body.street !== undefined ? body.street : existing[0].street,
            city: body.city !== undefined ? body.city : existing[0].city,
            state: body.state !== undefined ? body.state : existing[0].state,
            country: body.country !== undefined ? body.country : existing[0].country,
            phoneCountryCode: body.phoneCountryCode !== undefined ? body.phoneCountryCode : existing[0].phoneCountryCode,
            phoneNumber: body.phoneNumber !== undefined ? body.phoneNumber : existing[0].phoneNumber,
        })
        .where(eq(shipperProfiles.userId, user.id))
        .returning();

    return c.json(serializeProfile(profile), 200);
};
