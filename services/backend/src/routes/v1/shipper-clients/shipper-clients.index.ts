import { createRouter } from '../../../lib/create-app';
import * as handlers from './shipper-clients.handlers';
import * as routes from './shipper-clients.routes';

const router = createRouter()
    .openapi(routes.listClients, handlers.listClients)
    .openapi(routes.addClient, handlers.addClient)
    .openapi(routes.getClient, handlers.getClient)
    .openapi(routes.updateClient, handlers.updateClient)
    .openapi(routes.removeClient, handlers.removeClient);

export default router;
