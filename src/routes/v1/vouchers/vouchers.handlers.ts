import { VouchService } from '../../../services';
import { ApiError } from '../../../lib/errors';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import type { AppRouteHandler } from '../../../lib/types';
import type { 
    GetPendingVouchesRoute, 
    GetVouchHistoryRoute, 
    ApproveVouchRoute, 
    DeclineVouchRoute 
} from './vouchers.routes';

export const getPendingVouches: AppRouteHandler<GetPendingVouchesRoute> = async (c) => {
    try {
        const service = new VouchService({ context: c });
        const requests = await service.getPendingRequests();
        const formattedRequests = requests.map(req => ({
            ...req,
            requesterImage: req.requesterImage ?? null,
            status: req.status as 'PENDING' | 'APPROVED' | 'DECLINED',
            requestedAt: req.requestedAt.toISOString(),
        }));
        return c.json(formattedRequests, HttpStatusCodes.OK);
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

export const getVouchHistory: AppRouteHandler<GetVouchHistoryRoute> = async (c) => {
    try {
        const service = new VouchService({ context: c });
        const history = await service.getHistory();
        const formattedHistory = history.map(h => ({
            ...h,
            status: h.status as 'PENDING' | 'APPROVED' | 'DECLINED',
            updatedAt: h.updatedAt.toISOString(),
        }));
        return c.json(formattedHistory, HttpStatusCodes.OK);
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

export const approveVouch: AppRouteHandler<ApproveVouchRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const service = new VouchService({ context: c });
        const result = await service.approveVouch(id);
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

export const declineVouch: AppRouteHandler<DeclineVouchRoute> = async (c) => {
    try {
        const { id } = c.req.valid('param');
        const service = new VouchService({ context: c });
        const result = await service.declineVouch(id);
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
