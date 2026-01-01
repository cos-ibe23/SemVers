import { eq, and, isNull, ilike, count, desc } from 'drizzle-orm';
import { clients } from '../db/schema';
import { ForbiddenError, NotFoundError } from '../lib/errors';
import { Resources } from '../lib/user-can';
import { Service, type ServiceOptions } from './service';

export interface CreateClientInput {
    name: string;
    email?: string | null;
    phone?: string | null;
}

export interface UpdateClientInput {
    name?: string;
    email?: string | null;
    phone?: string | null;
}

export interface ListClientsOptions {
    page?: number;
    limit?: number;
    search?: string;
}

export interface PaginatedClients {
    data: typeof clients.$inferSelect[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

/**
 * Client Service
 *
 * Handles all client-related business logic with permission checking
 */
export class ClientService extends Service {
    constructor(options: ServiceOptions = {}) {
        super(options);
    }

    /**
     * Create a new client
     */
    async create(input: CreateClientInput): Promise<typeof clients.$inferSelect> {
        const userId = this.requireUserId();

        // Check permission
        if (!this.userCan.canCreate(Resources.CLIENTS)) {
            throw new ForbiddenError('You are not authorized to create clients');
        }

        const [client] = await this.db
            .insert(clients)
            .values({
                ownerUserId: userId,
                name: input.name,
                email: input.email ?? null,
                phone: input.phone ?? null,
            })
            .returning();

        this.log('client_create', {
            clientId: client.id,
            clientName: client.name,
        });

        return client;
    }

    /**
     * Get a client by ID
     */
    async getById(id: number): Promise<typeof clients.$inferSelect> {
        const userId = this.requireUserId();

        const [client] = await this.db
            .select()
            .from(clients)
            .where(
                and(
                    eq(clients.id, id),
                    isNull(clients.deletedAt)
                )
            )
            .limit(1);

        if (!client) {
            throw new NotFoundError('Client not found');
        }

        // Check permission with resource instance
        if (!this.userCan.canRead(Resources.CLIENTS, client)) {
            throw new ForbiddenError('You are not authorized to view this client');
        }

        return client;
    }

    /**
     * List clients with pagination and search
     */
    async list(options: ListClientsOptions = {}): Promise<PaginatedClients> {
        const userId = this.requireUserId();
        const { page = 1, limit = 20, search } = options;
        const offset = (page - 1) * limit;

        // Check permission
        if (!this.userCan.canList(Resources.CLIENTS)) {
            throw new ForbiddenError('You are not authorized to list clients');
        }

        // Build where conditions
        // Non-admin users can only see their own clients
        const baseConditions = this.userCan.isAdmin()
            ? [isNull(clients.deletedAt)]
            : [eq(clients.ownerUserId, userId), isNull(clients.deletedAt)];

        const whereConditions = search
            ? [...baseConditions, ilike(clients.name, `%${search}%`)]
            : baseConditions;

        // Get total count
        const [{ total }] = await this.db
            .select({ total: count() })
            .from(clients)
            .where(and(...whereConditions));

        // Get paginated results
        const results = await this.db
            .select()
            .from(clients)
            .where(and(...whereConditions))
            .orderBy(desc(clients.createdAt))
            .limit(limit)
            .offset(offset);

        return {
            data: results,
            total,
            page,
            limit,
            hasMore: offset + results.length < total,
        };
    }

    /**
     * Update a client
     */
    async update(id: number, input: UpdateClientInput): Promise<typeof clients.$inferSelect> {
        // First get the client to check ownership
        const existing = await this.getById(id);

        // Check permission
        if (!this.userCan.canUpdate(Resources.CLIENTS, existing)) {
            throw new ForbiddenError('You are not authorized to update this client');
        }

        const [client] = await this.db
            .update(clients)
            .set(input)
            .where(eq(clients.id, id))
            .returning();

        this.log('client_update', {
            clientId: client.id,
            updates: Object.keys(input),
        });

        return client;
    }

    /**
     * Soft delete a client
     */
    async delete(id: number): Promise<void> {
        // First get the client to check ownership
        const existing = await this.getById(id);

        // Check permission
        if (!this.userCan.canDelete(Resources.CLIENTS, existing)) {
            throw new ForbiddenError('You are not authorized to delete this client');
        }

        await this.db
            .update(clients)
            .set({ deletedAt: new Date() })
            .where(eq(clients.id, id));

        this.log('client_delete', {
            clientId: id,
        });
    }
}
