import { PickupService } from '../../../services/pickup-service';
import { ApiError } from '../../../lib/errors';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import type { AppRouteHandler } from '../../../lib/types';
import type {
    ListPickupsRoute,
    GetPickupRoute,
    CreatePickupRoute,
    UpdatePickupRoute,
    DeletePickupRoute,
} from './pickups.routes';

export const listPickups: AppRouteHandler<ListPickupsRoute> = async (c) => {
    try {
        const query = c.req.valid('query');
        const service = new PickupService({ context: c });
        const result = await service.list(query);

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'listPickups' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.UNAUTHORIZED:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNAUTHORIZED);
            case HttpStatusCodes.FORBIDDEN:
                return c.json(apiError.toResponseError(), HttpStatusCodes.FORBIDDEN);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};

export const getPickup: AppRouteHandler<GetPickupRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const service = new PickupService({ context: c });
        const result = await service.getById(id);

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'getPickup' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.UNAUTHORIZED:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNAUTHORIZED);
            case HttpStatusCodes.FORBIDDEN:
                return c.json(apiError.toResponseError(), HttpStatusCodes.FORBIDDEN);
            case HttpStatusCodes.NOT_FOUND:
                return c.json(apiError.toResponseError(), HttpStatusCodes.NOT_FOUND);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};

export const createPickup: AppRouteHandler<CreatePickupRoute> = async (c) => {
    try {
        const body = c.req.valid('json');
        const service = new PickupService({ context: c });
        const result = await service.create(body);

        return c.json(result, HttpStatusCodes.CREATED);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'createPickup' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.BAD_REQUEST:
                return c.json(apiError.toResponseError(), HttpStatusCodes.BAD_REQUEST);
            case HttpStatusCodes.UNAUTHORIZED:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNAUTHORIZED);
            case HttpStatusCodes.FORBIDDEN:
                return c.json(apiError.toResponseError(), HttpStatusCodes.FORBIDDEN);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};

export const updatePickup: AppRouteHandler<UpdatePickupRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const body = c.req.valid('json');
        const service = new PickupService({ context: c });
        const result = await service.update(id, body);

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'updatePickup' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.BAD_REQUEST:
                return c.json(apiError.toResponseError(), HttpStatusCodes.BAD_REQUEST);
            case HttpStatusCodes.UNAUTHORIZED:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNAUTHORIZED);
            case HttpStatusCodes.FORBIDDEN:
                return c.json(apiError.toResponseError(), HttpStatusCodes.FORBIDDEN);
            case HttpStatusCodes.NOT_FOUND:
                return c.json(apiError.toResponseError(), HttpStatusCodes.NOT_FOUND);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};

export const deletePickup: AppRouteHandler<DeletePickupRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const service = new PickupService({ context: c });
        await service.delete(id);

        return c.json({ success: true }, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'deletePickup' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.BAD_REQUEST:
                return c.json(apiError.toResponseError(), HttpStatusCodes.BAD_REQUEST);
            case HttpStatusCodes.UNAUTHORIZED:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNAUTHORIZED);
            case HttpStatusCodes.FORBIDDEN:
                return c.json(apiError.toResponseError(), HttpStatusCodes.FORBIDDEN);
            case HttpStatusCodes.NOT_FOUND:
                return c.json(apiError.toResponseError(), HttpStatusCodes.NOT_FOUND);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};
