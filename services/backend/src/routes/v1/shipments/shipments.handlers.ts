import { Context } from 'hono';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { BoxService } from '../../../services/box-service';
import { BoxStatus } from '../../../constants/enums';
import { ApiError } from '../../../lib/errors';
import type { 
    ListRoute, 
    CreateRoute, 
    GetOneRoute, 
    ManifestRoute,
    DeliverRoute 
} from './shipments.routes';
import { RouteHandler } from '@hono/zod-openapi';
import type { AppBindings } from '../../../lib/types';

export const list: RouteHandler<ListRoute, AppBindings> = async (c) => {
    try {
        const service = new BoxService({ user: c.get('authenticatedUser') });
        
        const boxes = await service.list({ filter: 'all' });
        const shipments = boxes.filter(b => 
            b.status === BoxStatus.SHIPPED || b.status === BoxStatus.DELIVERED
        );
        
        return c.json(shipments, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'listShipments' });

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

export const create: RouteHandler<CreateRoute, AppBindings> = async (c) => {
    try {
        const { boxId } = c.req.valid('json');
        const service = new BoxService({ user: c.get('authenticatedUser') });
        
        const shipment = await service.update(boxId, { status: BoxStatus.SHIPPED });
        
        return c.json(shipment, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'createShipment' });

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

export const getOne: RouteHandler<GetOneRoute, AppBindings> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const service = new BoxService({ user: c.get('authenticatedUser') });
        const shipment = await service.getById(id);
        
        return c.json(shipment, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'getShipment' });

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

export const manifest: RouteHandler<ManifestRoute, AppBindings> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const service = new BoxService({ user: c.get('authenticatedUser') });
        const shipment = await service.getById(id);
        
        return c.json(shipment, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'getShipmentManifest' });

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

export const deliver: RouteHandler<DeliverRoute, AppBindings> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const service = new BoxService({ user: c.get('authenticatedUser') });
        
        const shipment = await service.update(id, { status: BoxStatus.DELIVERED });
        
        return c.json(shipment, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'deliverShipment' });

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
