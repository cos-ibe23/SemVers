import { createRouter } from '../../../lib/create-app';
import * as handlers from './pickup-requests.handlers';
import * as routes from './pickup-requests.routes';

const router = createRouter()
    .openapi(routes.listPickupRequests, handlers.listPickupRequests)
    .openapi(routes.getPickupRequest, handlers.getPickupRequest)
    .openapi(routes.updatePickupRequest, handlers.updatePickupRequest)
    .openapi(routes.deletePickupRequest, handlers.deletePickupRequest)
    .openapi(routes.convertToPickup, handlers.convertToPickup);

export default router;
