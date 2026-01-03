import { createRouter } from '../../../lib/create-app';
import * as handlers from './items.handlers';
import * as routes from './items.routes';

const router = createRouter()
    .openapi(routes.listPickupItems, handlers.listPickupItems)
    .openapi(routes.addPickupItem, handlers.addPickupItem)
    .openapi(routes.getItem, handlers.getItem)
    .openapi(routes.updateItem, handlers.updateItem)
    .openapi(routes.deleteItem, handlers.deleteItem);

export default router;
