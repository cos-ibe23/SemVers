import { ItemService } from '../../../services/item-service';
import { ApiError } from '../../../lib/errors';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import type { AppRouteHandler } from '../../../lib/types';
import type {
    ListPickupItemsRoute,
    AddPickupItemRoute,
    GetItemRoute,
    UpdateItemRoute,
    DeleteItemRoute,
} from './items.routes';

export const listPickupItems: AppRouteHandler<ListPickupItemsRoute> = async (c) => {
    try {
        const { pickupId } = c.req.valid('param');
        const service = new ItemService({ context: c });
        const result = await service.listByPickup(pickupId);

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'listPickupItems' });

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

export const addPickupItem: AppRouteHandler<AddPickupItemRoute> = async (c) => {
    try {
        const { pickupId } = c.req.valid('param');
        const body = c.req.valid('json');
        const service = new ItemService({ context: c });
        const result = await service.addToPickup(pickupId, body);

        return c.json(result, HttpStatusCodes.CREATED);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'addPickupItem' });

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

export const getItem: AppRouteHandler<GetItemRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const service = new ItemService({ context: c });
        const result = await service.getById(id);

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'getItem' });

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

export const updateItem: AppRouteHandler<UpdateItemRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const body = c.req.valid('json');
        const service = new ItemService({ context: c });
        const result = await service.update(id, body);

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'updateItem' });

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

export const deleteItem: AppRouteHandler<DeleteItemRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const service = new ItemService({ context: c });
        await service.delete(id);

        return c.json({ success: true }, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'deleteItem' });

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
