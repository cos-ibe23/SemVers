import { BoxService } from '../../../services/box-service';
import { ApiError } from '../../../lib/errors';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import type { AppRouteHandler } from '../../../lib/types';
import type {
    ListBoxsRoute,
    CreateBoxRoute,
    GetBoxRoute,
    UpdateBoxRoute,
    TransferBoxRoute,
    AddPickupsToBoxRoute,
    RemovePickupFromBoxRoute,
    ManageBoxItemsRoute
} from './boxes.routes';

export const listBoxes: AppRouteHandler<ListBoxsRoute> = async (c) => {
    try {
        const query = c.req.valid('query');
        const service = new BoxService({ context: c });
        const result = await service.list(query);
        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
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

export const createBox: AppRouteHandler<CreateBoxRoute> = async (c) => {
    try {
        const body = c.req.valid('json');
        const service = new BoxService({ context: c });
        const result = await service.create(body);
        return c.json(result, HttpStatusCodes.CREATED);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
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

export const getBox: AppRouteHandler<GetBoxRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const service = new BoxService({ context: c });
        const result = await service.getById(id);
        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
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

export const updateBox: AppRouteHandler<UpdateBoxRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const body = c.req.valid('json');
        const service = new BoxService({ context: c });
        const result = await service.update(id, body);
        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
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

export const transferBox: AppRouteHandler<TransferBoxRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const { newOwnerEmail } = c.req.valid('json');
        const service = new BoxService({ context: c });
        const result = await service.transfer(id, newOwnerEmail);
        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
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

export const addPickupsToBox: AppRouteHandler<AddPickupsToBoxRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const { pickupIds } = c.req.valid('json');
        const service = new BoxService({ context: c });
        const result = await service.addPickups(id, pickupIds);
        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
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

export const removePickupFromBox: AppRouteHandler<RemovePickupFromBoxRoute> = async (c) => {
    try {
        const { id, pickupId } = c.req.valid('param');
        const service = new BoxService({ context: c });
        const result = await service.removePickup(id, pickupId);
        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
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

export const manageBoxItems: AppRouteHandler<ManageBoxItemsRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const body = c.req.valid('json');
        const service = new BoxService({ context: c });
        const result = await service.manageItems(id, body);
        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
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
