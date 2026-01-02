import { AuthService } from '../../../services';
import { ApiError } from '../../../lib/errors';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import type { AppRouteHandler } from '../../../lib/types';
import type { GetMeRoute, OnboardRoute, UpdateProfileRoute } from './auth.routes';

export const getMe: AppRouteHandler<GetMeRoute> = async (c) => {
    try {
        const user = c.get('authenticatedUser')!;
        const session = c.get('session')!;

        const service = new AuthService({ context: c });
        const fullUser = await service.getUser();

        return c.json({
            user: fullUser,
            session: {
                id: session.id,
                userId: session.userId,
                expiresAt: session.expiresAt.toISOString(),
            },
        }, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'getMe' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.UNAUTHORIZED:
            case HttpStatusCodes.NOT_FOUND:
                return c.json(apiError.toResponseError(), apiError.statusCode);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};

export const onboard: AppRouteHandler<OnboardRoute> = async (c) => {
    try {
        const body = c.req.valid('json');
        const service = new AuthService({ context: c });
        const user = await service.onboard(body);

        return c.json(user, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'onboard' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.BAD_REQUEST:
            case HttpStatusCodes.UNAUTHORIZED:
            case HttpStatusCodes.NOT_FOUND:
            case HttpStatusCodes.UNPROCESSABLE_ENTITY:
                return c.json(apiError.toResponseError(), apiError.statusCode);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};

export const updateProfile: AppRouteHandler<UpdateProfileRoute> = async (c) => {
    try {
        const body = c.req.valid('json');
        const service = new AuthService({ context: c });
        const user = await service.updateProfile(body);

        return c.json(user, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'updateProfile' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.BAD_REQUEST:
            case HttpStatusCodes.UNAUTHORIZED:
            case HttpStatusCodes.NOT_FOUND:
            case HttpStatusCodes.UNPROCESSABLE_ENTITY:
                return c.json(apiError.toResponseError(), apiError.statusCode);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};
