import { createRouter } from '../../../lib/create-app';
import * as handlers from './vouchers.handlers';
import * as routes from './vouchers.routes';

const router = createRouter()
    .openapi(routes.getPendingVouches, handlers.getPendingVouches)
    .openapi(routes.getVouchHistory, handlers.getVouchHistory)
    .openapi(routes.approveVouch, handlers.approveVouch)
    .openapi(routes.declineVouch, handlers.declineVouch);

export default router;
