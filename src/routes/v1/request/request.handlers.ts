import { PublicRequestService } from '../../../services/public-request-service';
import { ApiError } from '../../../lib/errors';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import type { AppRouteHandler } from '../../../lib/types';
import type {
    GetShipperBySlugRoute,
    SubmitPublicRequestRoute,
} from './request.routes';

export const getShipperBySlug: AppRouteHandler<GetShipperBySlugRoute> = async (c) => {
    try {
        const { slug } = c.req.valid('param');
        const service = new PublicRequestService({ context: c });
        const result = await service.getShipperBySlug(slug);

        return c.json(result, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'getShipperBySlug' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.BAD_REQUEST:
                return c.json(apiError.toResponseError(), HttpStatusCodes.BAD_REQUEST);
            case HttpStatusCodes.NOT_FOUND:
                return c.json(apiError.toResponseError(), HttpStatusCodes.NOT_FOUND);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};

export const submitPublicRequest: AppRouteHandler<SubmitPublicRequestRoute> = async (c) => {
    try {
        const { slug } = c.req.valid('param');
        const body = c.req.valid('json');
        const service = new PublicRequestService({ context: c });
        const result = await service.submitRequest(slug, body);

        return c.json(result, HttpStatusCodes.CREATED);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'submitPublicRequest' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.BAD_REQUEST:
                return c.json(apiError.toResponseError(), HttpStatusCodes.BAD_REQUEST);
            case HttpStatusCodes.NOT_FOUND:
                return c.json(apiError.toResponseError(), HttpStatusCodes.NOT_FOUND);
            case HttpStatusCodes.UNPROCESSABLE_ENTITY:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNPROCESSABLE_ENTITY);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};
