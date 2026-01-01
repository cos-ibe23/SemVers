import { createRouter } from '../../../lib/create-app';
import * as handlers from './clients.handlers';
import * as routes from './clients.routes';

const router = createRouter()
    .openapi(routes.listClients, handlers.listClients)
    .openapi(routes.createClient, handlers.createClient)
    .openapi(routes.getClient, handlers.getClient)
    .openapi(routes.updateClient, handlers.updateClient)
    .openapi(routes.deleteClient, handlers.deleteClient);

export default router;
