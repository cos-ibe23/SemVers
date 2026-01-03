import { ShipperClientService } from '../../../services';
import { ApiError } from '../../../lib/errors';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import type { AppRouteHandler } from '../../../lib/types';
import type {
    ListClientsRoute,
    AddClientRoute,
    GetClientRoute,
    UpdateClientRoute,
    RemoveClientRoute,
} from './shipper-clients.routes';

export const listClients: AppRouteHandler<ListClientsRoute> = async (c) => {
    try {
        const { page, limit, search } = c.req.valid('query');
        const service = new ShipperClientService({ context: c });
        const result = await service.list({ page, limit, search });

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'listClients' });

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

export const addClient: AppRouteHandler<AddClientRoute> = async (c) => {
    try {
        const body = c.req.valid('json');
        const service = new ShipperClientService({ context: c });

        const result = body.clientUserId
            ? await service.addClient({
                  clientUserId: body.clientUserId,
                  nickname: body.nickname,
                  phone: body.phone,
              })
            : await service.createAndAddClient({
                  name: body.name!,
                  email: body.email!,
                  nickname: body.nickname,
                  phone: body.phone,
              });

        return c.json(result, HttpStatusCodes.CREATED);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'addClient' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.BAD_REQUEST:
                return c.json(apiError.toResponseError(), HttpStatusCodes.BAD_REQUEST);
            case HttpStatusCodes.UNAUTHORIZED:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNAUTHORIZED);
            case HttpStatusCodes.FORBIDDEN:
                return c.json(apiError.toResponseError(), HttpStatusCodes.FORBIDDEN);
            case HttpStatusCodes.NOT_FOUND:
                return c.json(apiError.toResponseError(), HttpStatusCodes.NOT_FOUND);
            case HttpStatusCodes.CONFLICT:
                return c.json(apiError.toResponseError(), HttpStatusCodes.CONFLICT);
            case HttpStatusCodes.UNPROCESSABLE_ENTITY:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNPROCESSABLE_ENTITY);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};

export const getClient: AppRouteHandler<GetClientRoute> = async (c) => {
    try {
        const { clientId } = c.req.valid('param');
        const service = new ShipperClientService({ context: c });
        const result = await service.getByClientId(clientId);

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'getClient' });

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

export const updateClient: AppRouteHandler<UpdateClientRoute> = async (c) => {
    try {
        const { clientId } = c.req.valid('param');
        const updates = c.req.valid('json');
        const service = new ShipperClientService({ context: c });
        const result = await service.update(clientId, updates);

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'updateClient' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.BAD_REQUEST:
            case HttpStatusCodes.UNAUTHORIZED:
            case HttpStatusCodes.FORBIDDEN:
            case HttpStatusCodes.NOT_FOUND:
            case HttpStatusCodes.UNPROCESSABLE_ENTITY:
                return c.json(apiError.toResponseError(), apiError.statusCode);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};

export const removeClient: AppRouteHandler<RemoveClientRoute> = async (c) => {
    try {
        const { clientId } = c.req.valid('param');
        const service = new ShipperClientService({ context: c });
        await service.remove(clientId);

        return c.json({ success: true }, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'removeClient' });

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
