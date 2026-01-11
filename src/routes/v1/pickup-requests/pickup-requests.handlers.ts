import { PickupRequestService } from '../../../services/pickup-request-service';
import { ApiError } from '../../../lib/errors';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import type { AppRouteHandler } from '../../../lib/types';
import type {
    ListPickupRequestsRoute,
    GetPickupRequestRoute,
    UpdatePickupRequestRoute,
    DeletePickupRequestRoute,
} from './pickup-requests.routes';

export const listPickupRequests: AppRouteHandler<ListPickupRequestsRoute> = async (c) => {
    try {
        const query = c.req.valid('query');
        const service = new PickupRequestService({ context: c });
        const result = await service.list(query);

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'listPickupRequests' });

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

export const getPickupRequest: AppRouteHandler<GetPickupRequestRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const service = new PickupRequestService({ context: c });
        const result = await service.getById(id);

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'getPickupRequest' });

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

export const updatePickupRequest: AppRouteHandler<UpdatePickupRequestRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const body = c.req.valid('json');
        const service = new PickupRequestService({ context: c });
        const result = await service.update(id, body);

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'updatePickupRequest' });

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

export const deletePickupRequest: AppRouteHandler<DeletePickupRequestRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const service = new PickupRequestService({ context: c });
        await service.delete(id);

        return c.json({ success: true }, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'deletePickupRequest' });

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
