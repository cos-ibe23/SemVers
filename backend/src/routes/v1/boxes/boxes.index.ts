import { createRouter } from '../../../lib/create-app';
import * as handlers from './boxes.handlers';
import * as routes from './boxes.routes';

const router = createRouter()
    .openapi(routes.listBoxs, handlers.listBoxes)
    .openapi(routes.createBox, handlers.createBox)
    .openapi(routes.getBox, handlers.getBox)
    .openapi(routes.updateBox, handlers.updateBox)
    .openapi(routes.transferBox, handlers.transferBox)
    .openapi(routes.addPickupsToBox, handlers.addPickupsToBox)
    .openapi(routes.removePickupFromBox, handlers.removePickupFromBox)
    .openapi(routes.manageBoxItems, handlers.manageBoxItems);

export default router;
