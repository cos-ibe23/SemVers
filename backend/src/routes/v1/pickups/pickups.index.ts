import { createRouter } from '../../../lib/create-app';
import * as handlers from './pickups.handlers';
import * as routes from './pickups.routes';

const router = createRouter()
    .openapi(routes.listPickups, handlers.listPickups)
    .openapi(routes.getPickup, handlers.getPickup)
    .openapi(routes.createPickup, handlers.createPickup)
    .openapi(routes.updatePickup, handlers.updatePickup)
    .openapi(routes.deletePickup, handlers.deletePickup);

export default router;
