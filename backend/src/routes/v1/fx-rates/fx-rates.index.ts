import { createRouter } from '../../../lib/create-app';
import * as handlers from './fx-rates.handlers';
import * as routes from './fx-rates.routes';

const router = createRouter()
    .openapi(routes.listFxRates, handlers.listFxRates)
    .openapi(routes.getCurrentFxRate, handlers.getCurrentFxRate)
    .openapi(routes.getFxRate, handlers.getFxRate)
    .openapi(routes.createFxRate, handlers.createFxRate)
    .openapi(routes.updateFxRate, handlers.updateFxRate)
    .openapi(routes.deleteFxRate, handlers.deleteFxRate);

export default router;
