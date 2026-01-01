import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { shipperProfiles } from '../../../db/schema';
import type { AppRouteHandler } from '../../../lib/types';
import type { GetMeRoute } from './auth.routes';

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
        profile: profile
            ? {
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
              }
            : null,
    }, 200);
};
