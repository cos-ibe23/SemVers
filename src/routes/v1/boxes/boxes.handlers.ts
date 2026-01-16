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
        return c.json(apiError.toResponseError(), apiError.statusCode as any);
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
        return c.json(apiError.toResponseError(), apiError.statusCode as any);
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
        return c.json(apiError.toResponseError(), apiError.statusCode as any);
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
        return c.json(apiError.toResponseError(), apiError.statusCode as any);
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
        return c.json(apiError.toResponseError(), apiError.statusCode as any);
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
        return c.json(apiError.toResponseError(), apiError.statusCode as any);
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
        return c.json(apiError.toResponseError(), apiError.statusCode as any);
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
        return c.json(apiError.toResponseError(), apiError.statusCode as any);
    }
};
