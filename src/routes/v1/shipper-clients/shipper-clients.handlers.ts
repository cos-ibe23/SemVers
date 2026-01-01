import { ShipperClientService, type ShipperClientWithUser } from '../../../services';
import type { AppRouteHandler } from '../../../lib/types';
import type {
    ListClientsRoute,
    AddClientRoute,
    GetClientRoute,
    UpdateClientRoute,
    RemoveClientRoute,
} from './shipper-clients.routes';

// Helper to format shipper-client for response
function formatShipperClient(sc: ShipperClientWithUser) {
    return {
        shipperId: sc.shipperId,
        clientId: sc.clientId,
        nickname: sc.nickname,
        phone: sc.phone,
        createdAt: sc.createdAt.toISOString(),
        client: {
            id: sc.client.id,
            name: sc.client.name,
            email: sc.client.email,
            image: sc.client.image,
        },
    };
}

// GET /v1/clients - List clients
export const listClients: AppRouteHandler<ListClientsRoute> = async (c) => {
    const { page, limit, search } = c.req.valid('query');

    const service = new ShipperClientService({ context: c });
    const result = await service.list({ page, limit, search });

    return c.json({
        data: result.data.map(formatShipperClient),
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore,
    }, 200);
};

// POST /v1/clients - Add client (existing user or create new)
export const addClient: AppRouteHandler<AddClientRoute> = async (c) => {
    const body = c.req.valid('json');

    const service = new ShipperClientService({ context: c });

    let result: ShipperClientWithUser;

    if (body.clientUserId) {
        // Add existing user as client
        result = await service.addClient({
            clientUserId: body.clientUserId,
            nickname: body.nickname,
            phone: body.phone,
        });
    } else {
        // Create new client user and add
        result = await service.createAndAddClient({
            name: body.name!,
            email: body.email!,
            nickname: body.nickname,
            phone: body.phone,
        });
    }

    return c.json(formatShipperClient(result), 201);
};

// GET /v1/clients/:clientId - Get client
export const getClient: AppRouteHandler<GetClientRoute> = async (c) => {
    const { clientId } = c.req.valid('param');

    const service = new ShipperClientService({ context: c });
    const result = await service.getByClientId(clientId);

    return c.json(formatShipperClient(result), 200);
};

// PATCH /v1/clients/:clientId - Update client
export const updateClient: AppRouteHandler<UpdateClientRoute> = async (c) => {
    const { clientId } = c.req.valid('param');
    const updates = c.req.valid('json');

    const service = new ShipperClientService({ context: c });
    const result = await service.update(clientId, updates);

    return c.json(formatShipperClient(result), 200);
};

// DELETE /v1/clients/:clientId - Remove client
export const removeClient: AppRouteHandler<RemoveClientRoute> = async (c) => {
    const { clientId } = c.req.valid('param');

    const service = new ShipperClientService({ context: c });
    await service.remove(clientId);

    return c.json({ success: true }, 200);
};
