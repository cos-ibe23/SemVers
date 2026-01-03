import { createRouter } from '../../../lib/create-app';
import * as handlers from './request.handlers';
import * as routes from './request.routes';

const router = createRouter()
    .openapi(routes.getShipperBySlug, handlers.getShipperBySlug)
    .openapi(routes.submitPublicRequest, handlers.submitPublicRequest);

export default router;
