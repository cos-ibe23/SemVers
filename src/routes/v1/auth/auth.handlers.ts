import { AuthService } from '../../../services';
import type { AppRouteHandler } from '../../../lib/types';
import type { GetMeRoute, OnboardRoute, UpdateProfileRoute } from './auth.routes';

export const getMe: AppRouteHandler<GetMeRoute> = async (c) => {
    const user = c.get('authenticatedUser')!;
    const session = c.get('session')!;

    const service = new AuthService({ context: c });
    const fullUser = await service.getUserOrThrow();

    return c.json({
        user: fullUser,
        session: {
            id: session.id,
            userId: session.userId,
            expiresAt: session.expiresAt.toISOString(),
        },
    }, 200);
};

export const onboard: AppRouteHandler<OnboardRoute> = async (c) => {
    const body = c.req.valid('json');
    const service = new AuthService({ context: c });
    const user = await service.onboard(body);

    return c.json(user, 200);
};

export const updateProfile: AppRouteHandler<UpdateProfileRoute> = async (c) => {
    const body = c.req.valid('json');
    const service = new AuthService({ context: c });
    const user = await service.updateProfile(body);

    return c.json(user, 200);
};
