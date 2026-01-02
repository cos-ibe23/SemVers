import { ShipperClientService } from '../../../services';
import type { AppRouteHandler } from '../../../lib/types';
import type {
    ListClientsRoute,
    AddClientRoute,
    GetClientRoute,
    UpdateClientRoute,
    RemoveClientRoute,
} from './shipper-clients.routes';

export const listClients: AppRouteHandler<ListClientsRoute> = async (c) => {
    const { page, limit, search } = c.req.valid('query');
    const service = new ShipperClientService({ context: c });
    const result = await service.list({ page, limit, search });

    return c.json(result, 200);
};

export const addClient: AppRouteHandler<AddClientRoute> = async (c) => {
    const body = c.req.valid('json');
    const service = new ShipperClientService({ context: c });

    const result = body.clientUserId
        ? await service.addClient({
              clientUserId: body.clientUserId,
              nickname: body.nickname,
              phone: body.phone,
          })
        : await service.createAndAddClient({
              name: body.name!,
              email: body.email!,
              nickname: body.nickname,
              phone: body.phone,
          });

    return c.json(result, 201);
};

export const getClient: AppRouteHandler<GetClientRoute> = async (c) => {
    const { clientId } = c.req.valid('param');
    const service = new ShipperClientService({ context: c });
    const result = await service.getByClientId(clientId);

    return c.json(result, 200);
};

export const updateClient: AppRouteHandler<UpdateClientRoute> = async (c) => {
    const { clientId } = c.req.valid('param');
    const updates = c.req.valid('json');
    const service = new ShipperClientService({ context: c });
    const result = await service.update(clientId, updates);

    return c.json(result, 200);
};

export const removeClient: AppRouteHandler<RemoveClientRoute> = async (c) => {
    const { clientId } = c.req.valid('param');
    const service = new ShipperClientService({ context: c });
    await service.remove(clientId);

    return c.json({ success: true }, 200);
};
