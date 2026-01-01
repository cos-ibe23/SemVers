import { eq, and, isNull, ilike, count, desc, or } from 'drizzle-orm';
import { user, shipperClients } from '../db/schema';
import { ForbiddenError, NotFoundError, BadRequestError } from '../lib/errors';
import { Resources, UserRoles } from '../lib/user-can';
import { Service, type ServiceOptions } from './service';

export interface AddClientInput {
    clientUserId: string;
    nickname?: string | null;
    phone?: string | null;
}

export interface CreateAndAddClientInput {
    name: string;
    email: string;
    nickname?: string | null;
    phone?: string | null;
}

export interface UpdateShipperClientInput {
    nickname?: string | null;
    phone?: string | null;
}

export interface ListShipperClientsOptions {
    page?: number;
    limit?: number;
    search?: string;
}

// Combined type for shipper-client relationship with user data
export interface ShipperClientWithUser {
    shipperId: string;
    clientId: string;
    nickname: string | null;
    phone: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    client: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
}

export interface PaginatedShipperClients {
    data: ShipperClientWithUser[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

/**
 * Shipper Client Service
 *
 * Handles shipper-client relationships.
 * Shippers can add existing users as clients or create new client users.
 */
export class ShipperClientService extends Service {
    constructor(options: ServiceOptions = {}) {
        super(options);
    }

    /**
     * Add an existing user as a client
     */
    async addClient(input: AddClientInput): Promise<ShipperClientWithUser> {
        const shipperId = this.requireUserId();

        // Check permission
        if (!this.userCan.canCreate(Resources.SHIPPER_CLIENTS)) {
            throw new ForbiddenError('You are not authorized to add clients');
        }

        // Verify the client user exists and has CLIENT role
        const [clientUser] = await this.db
            .select()
            .from(user)
            .where(eq(user.id, input.clientUserId))
            .limit(1);

        if (!clientUser) {
            throw new NotFoundError('Client user not found');
        }

        if (clientUser.role !== UserRoles.CLIENT) {
            throw new BadRequestError('User is not a client');
        }

        // Check if relationship already exists
        const [existing] = await this.db
            .select()
            .from(shipperClients)
            .where(
                and(
                    eq(shipperClients.shipperId, shipperId),
                    eq(shipperClients.clientId, input.clientUserId)
                )
            )
            .limit(1);

        if (existing) {
            if (existing.deletedAt) {
                // Reactivate soft-deleted relationship
                await this.db
                    .update(shipperClients)
                    .set({
                        deletedAt: null,
                        nickname: input.nickname ?? null,
                        phone: input.phone ?? null,
                    })
                    .where(
                        and(
                            eq(shipperClients.shipperId, shipperId),
                            eq(shipperClients.clientId, input.clientUserId)
                        )
                    );
            } else {
                throw new BadRequestError('Client is already added');
            }
        } else {
            // Create new relationship
            await this.db.insert(shipperClients).values({
                shipperId,
                clientId: input.clientUserId,
                nickname: input.nickname ?? null,
                phone: input.phone ?? null,
            });
        }

        this.log('shipper_client_add', {
            clientId: input.clientUserId,
        });

        return this.getByClientId(input.clientUserId);
    }

    /**
     * Create a new client user and add them to this shipper
     */
    async createAndAddClient(input: CreateAndAddClientInput): Promise<ShipperClientWithUser> {
        const shipperId = this.requireUserId();

        // Check permission
        if (!this.userCan.canCreate(Resources.SHIPPER_CLIENTS)) {
            throw new ForbiddenError('You are not authorized to add clients');
        }

        // Check if email already exists
        const [existingUser] = await this.db
            .select()
            .from(user)
            .where(eq(user.email, input.email))
            .limit(1);

        if (existingUser) {
            throw new BadRequestError('A user with this email already exists');
        }

        // Create new client user
        const clientId = crypto.randomUUID();
        await this.db.insert(user).values({
            id: clientId,
            name: input.name,
            email: input.email,
            emailVerified: false,
            role: UserRoles.CLIENT,
        });

        // Create shipper-client relationship
        await this.db.insert(shipperClients).values({
            shipperId,
            clientId,
            nickname: input.nickname ?? null,
            phone: input.phone ?? null,
        });

        this.log('shipper_client_create', {
            clientId,
            clientEmail: input.email,
        });

        return this.getByClientId(clientId);
    }

    /**
     * Get a shipper-client relationship by client ID
     */
    async getByClientId(clientId: string): Promise<ShipperClientWithUser> {
        const shipperId = this.requireUserId();

        const results = await this.db
            .select({
                shipperId: shipperClients.shipperId,
                clientId: shipperClients.clientId,
                nickname: shipperClients.nickname,
                phone: shipperClients.phone,
                deletedAt: shipperClients.deletedAt,
                createdAt: shipperClients.createdAt,
                client: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                },
            })
            .from(shipperClients)
            .innerJoin(user, eq(shipperClients.clientId, user.id))
            .where(
                and(
                    eq(shipperClients.shipperId, shipperId),
                    eq(shipperClients.clientId, clientId),
                    isNull(shipperClients.deletedAt)
                )
            )
            .limit(1);

        const result = results[0];
        if (!result) {
            throw new NotFoundError('Client not found');
        }

        // Check permission with resource instance
        if (!this.userCan.canRead(Resources.SHIPPER_CLIENTS, { ownerUserId: result.shipperId })) {
            throw new ForbiddenError('You are not authorized to view this client');
        }

        return result;
    }

    /**
     * List shipper's clients with pagination and search
     */
    async list(options: ListShipperClientsOptions = {}): Promise<PaginatedShipperClients> {
        const shipperId = this.requireUserId();
        const { page = 1, limit = 20, search } = options;
        const offset = (page - 1) * limit;

        // Check permission
        if (!this.userCan.canList(Resources.SHIPPER_CLIENTS)) {
            throw new ForbiddenError('You are not authorized to list clients');
        }

        // Base conditions - shipper's clients that aren't deleted
        const baseConditions = this.userCan.isAdmin()
            ? [isNull(shipperClients.deletedAt)]
            : [eq(shipperClients.shipperId, shipperId), isNull(shipperClients.deletedAt)];

        // Add search condition if provided (search by client name, email, or nickname)
        const searchCondition = search
            ? or(
                  ilike(user.name, `%${search}%`),
                  ilike(user.email, `%${search}%`),
                  ilike(shipperClients.nickname, `%${search}%`)
              )
            : undefined;

        const whereConditions = searchCondition
            ? and(...baseConditions, searchCondition)
            : and(...baseConditions);

        // Get total count
        const [{ total }] = await this.db
            .select({ total: count() })
            .from(shipperClients)
            .innerJoin(user, eq(shipperClients.clientId, user.id))
            .where(whereConditions);

        // Get paginated results
        const results = await this.db
            .select({
                shipperId: shipperClients.shipperId,
                clientId: shipperClients.clientId,
                nickname: shipperClients.nickname,
                phone: shipperClients.phone,
                deletedAt: shipperClients.deletedAt,
                createdAt: shipperClients.createdAt,
                client: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                },
            })
            .from(shipperClients)
            .innerJoin(user, eq(shipperClients.clientId, user.id))
            .where(whereConditions)
            .orderBy(desc(shipperClients.createdAt))
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
     * Update a shipper-client relationship (nickname, phone)
     */
    async update(clientId: string, input: UpdateShipperClientInput): Promise<ShipperClientWithUser> {
        const shipperId = this.requireUserId();

        // First get to verify it exists and check permission
        await this.getByClientId(clientId);

        // Check permission
        if (!this.userCan.canUpdate(Resources.SHIPPER_CLIENTS, { ownerUserId: shipperId })) {
            throw new ForbiddenError('You are not authorized to update this client');
        }

        await this.db
            .update(shipperClients)
            .set({
                nickname: input.nickname !== undefined ? input.nickname : undefined,
                phone: input.phone !== undefined ? input.phone : undefined,
            })
            .where(
                and(
                    eq(shipperClients.shipperId, shipperId),
                    eq(shipperClients.clientId, clientId)
                )
            );

        this.log('shipper_client_update', {
            clientId,
            updates: Object.keys(input),
        });

        return this.getByClientId(clientId);
    }

    /**
     * Remove a client (soft delete the relationship)
     */
    async remove(clientId: string): Promise<void> {
        const shipperId = this.requireUserId();

        // First get to verify it exists and check permission
        await this.getByClientId(clientId);

        // Check permission
        if (!this.userCan.canDelete(Resources.SHIPPER_CLIENTS, { ownerUserId: shipperId })) {
            throw new ForbiddenError('You are not authorized to remove this client');
        }

        await this.db
            .update(shipperClients)
            .set({ deletedAt: new Date() })
            .where(
                and(
                    eq(shipperClients.shipperId, shipperId),
                    eq(shipperClients.clientId, clientId)
                )
            );

        this.log('shipper_client_remove', {
            clientId,
        });
    }
}
