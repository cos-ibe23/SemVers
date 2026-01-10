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
    const service = new VouchService({ context: c });
    const requests = await service.getPendingRequests();
    const formattedRequests = requests.map(req => ({
        ...req,
        requesterImage: req.requesterImage ?? null,
        status: req.status as 'PENDING' | 'APPROVED' | 'DECLINED', // Assertion since DB ensures valid enum
        requestedAt: req.requestedAt.toISOString(),
    }));
    return c.json(formattedRequests, HttpStatusCodes.OK);
};

export const getVouchHistory: AppRouteHandler<GetVouchHistoryRoute> = async (c) => {
    const service = new VouchService({ context: c });
    const history = await service.getHistory();
    const formattedHistory = history.map(h => ({
        ...h,
        status: h.status as 'PENDING' | 'APPROVED' | 'DECLINED',
        updatedAt: h.updatedAt.toISOString(),
    }));
    return c.json(formattedHistory, HttpStatusCodes.OK);
};

export const approveVouch: AppRouteHandler<ApproveVouchRoute> = async (c) => {
    const { id } = c.req.valid('param');
    const service = new VouchService({ context: c });
    const result = await service.approveVouch(id);
    return c.json(result, HttpStatusCodes.OK);
};

export const declineVouch: AppRouteHandler<DeclineVouchRoute> = async (c) => {
    const { id } = c.req.valid('param');
    const service = new VouchService({ context: c });
    const result = await service.declineVouch(id);
    return c.json(result, HttpStatusCodes.OK);
};
