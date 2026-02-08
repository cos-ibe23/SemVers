import { createRouter } from '../../../lib/create-app';
import * as handlers from './shipments.handlers';
import * as routes from './shipments.routes';

const router = createRouter()
    .openapi(routes.list, handlers.list)
    .openapi(routes.create, handlers.create)
    .openapi(routes.getOne, handlers.getOne)
    .openapi(routes.manifest, handlers.manifest)
    .openapi(routes.deliver, handlers.deliver);

export default router;
