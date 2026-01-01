import { ClientService } from '../../../services';
import type { AppRouteHandler } from '../../../lib/types';
import type {
    ListClientsRoute,
    CreateClientRoute,
    GetClientRoute,
    UpdateClientRoute,
    DeleteClientRoute,
} from './clients.routes';

// Helper to format client for response
function formatClient(client: { id: number; ownerUserId: string; name: string; email: string | null; phone: string | null; avatarUrl: string | null; createdAt: Date }) {
    return {
        id: client.id,
        ownerUserId: client.ownerUserId,
        name: client.name,
        email: client.email,
        phone: client.phone,
        avatarUrl: client.avatarUrl,
        createdAt: client.createdAt.toISOString(),
    };
}

// GET /v1/clients - List clients
export const listClients: AppRouteHandler<ListClientsRoute> = async (c) => {
    const { page, limit, search } = c.req.valid('query');

    const clientService = new ClientService({ context: c });
    const result = await clientService.list({ page, limit, search });

    return c.json({
        data: result.data.map(formatClient),
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore,
    }, 200);
};

// POST /v1/clients - Create client
export const createClient: AppRouteHandler<CreateClientRoute> = async (c) => {
    const { name, email, phone } = c.req.valid('json');

    const clientService = new ClientService({ context: c });
    const client = await clientService.create({ name, email, phone });

    return c.json(formatClient(client), 201);
};

// GET /v1/clients/:id - Get client
export const getClient: AppRouteHandler<GetClientRoute> = async (c) => {
    const { id } = c.req.valid('param');

    const clientService = new ClientService({ context: c });
    const client = await clientService.getById(id);

    return c.json(formatClient(client), 200);
};

// PATCH /v1/clients/:id - Update client
export const updateClient: AppRouteHandler<UpdateClientRoute> = async (c) => {
    const { id } = c.req.valid('param');
    const updates = c.req.valid('json');

    const clientService = new ClientService({ context: c });
    const client = await clientService.update(id, updates);

    return c.json(formatClient(client), 200);
};

// DELETE /v1/clients/:id - Soft delete client
export const deleteClient: AppRouteHandler<DeleteClientRoute> = async (c) => {
    const { id } = c.req.valid('param');

    const clientService = new ClientService({ context: c });
    await clientService.delete(id);

    return c.json({ success: true }, 200);
};
