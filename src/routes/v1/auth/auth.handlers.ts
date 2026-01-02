import { AuthService } from '../../../services';
import type { AppRouteHandler } from '../../../lib/types';
import type { GetMeRoute, GetProfileRoute, OnboardProfileRoute, UpdateProfileRoute } from './auth.routes';

export const getMe: AppRouteHandler<GetMeRoute> = async (c) => {
    const user = c.get('authenticatedUser')!;
    const session = c.get('session')!;

    const service = new AuthService({ context: c });
    const profile = await service.getProfile();

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
        profile,
    }, 200);
};

export const getProfile: AppRouteHandler<GetProfileRoute> = async (c) => {
    const service = new AuthService({ context: c });
    const profile = await service.getProfileOrThrow();

    return c.json(profile, 200);
};

export const onboardProfile: AppRouteHandler<OnboardProfileRoute> = async (c) => {
    const body = c.req.valid('json');
    const service = new AuthService({ context: c });
    const profile = await service.createProfile(body);

    return c.json(profile, 201);
};

export const updateProfile: AppRouteHandler<UpdateProfileRoute> = async (c) => {
    const body = c.req.valid('json');
    const service = new AuthService({ context: c });
    const profile = await service.updateProfile(body);

    return c.json(profile, 200);
};
