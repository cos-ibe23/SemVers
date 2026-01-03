import { eq, and, isNull, ilike, count, desc, or } from 'drizzle-orm';
import {
    user,
    shipperClients,
    shipperClientResponseSchema,
    type ShipperClientResponse,
} from '../db/schema';
import { ApiError, ForbiddenError, NotFoundError, BadRequestError } from '../lib/errors';
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
    // Client's primary contact info (stored on user)
    phoneCountryCode?: string | null;
    phoneNumber?: string | null;
    // Shipper-specific fields (stored on junction table)
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
        phoneCountryCode: string | null;
        phoneNumber: string | null;
    };
}

export interface PaginatedShipperClients {
    data: ShipperClientResponse[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export class ShipperClientService extends Service {
    constructor(options: ServiceOptions = {}) {
        super(options);
    }

    public async addClient(input: AddClientInput): Promise<ShipperClientResponse> {
        try {
            const shipperId = this.requireUserId();

            if (!this.userCan.canCreate(Resources.SHIPPER_CLIENTS)) {
                throw new ForbiddenError('You are not authorized to add clients');
            }

            await this.validateClientUser(input.clientUserId);

            const existing = await this.findExistingRelationship(shipperId, input.clientUserId);

            if (existing) {
                if (existing.deletedAt) {
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
                await this.db.insert(shipperClients).values({
                    shipperId,
                    clientId: input.clientUserId,
                    nickname: input.nickname ?? null,
                    phone: input.phone ?? null,
                });
            }

            this.log('shipper_client_add', { clientId: input.clientUserId });

            return this.getByClientId(input.clientUserId);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'ShipperClientService.addClient' });
            throw apiError;
        }
    }

    public async createAndAddClient(input: CreateAndAddClientInput): Promise<ShipperClientResponse> {
        try {
            const shipperId = this.requireUserId();

            if (!this.userCan.canCreate(Resources.SHIPPER_CLIENTS)) {
                throw new ForbiddenError('You are not authorized to add clients');
            }

            const [existingUser] = await this.db
                .select()
                .from(user)
                .where(eq(user.email, input.email))
                .limit(1);

            if (existingUser) {
                throw new BadRequestError('A user with this email already exists');
            }

            const clientId = crypto.randomUUID();
            await this.db.insert(user).values({
                id: clientId,
                name: input.name,
                email: input.email,
                emailVerified: false,
                role: UserRoles.CLIENT,
                phoneCountryCode: input.phoneCountryCode ?? null,
                phoneNumber: input.phoneNumber ?? null,
            });

            await this.db.insert(shipperClients).values({
                shipperId,
                clientId,
                nickname: input.nickname ?? null,
                phone: input.phone ?? null,
            });

            this.log('shipper_client_create', { clientId, clientEmail: input.email });

            return this.getByClientId(clientId);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'ShipperClientService.createAndAddClient' });
            throw apiError;
        }
    }

    public async getByClientId(clientId: string): Promise<ShipperClientResponse> {
        try {
            const shipperId = this.requireUserId();

            const result = await this.fetchShipperClientWithUser(shipperId, clientId);
            if (!result) {
                throw new NotFoundError('Client not found');
            }

            if (!this.userCan.canRead(Resources.SHIPPER_CLIENTS, { ownerUserId: result.shipperId })) {
                throw new ForbiddenError('You are not authorized to view this client');
            }

            return shipperClientResponseSchema.parse(result);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'ShipperClientService.getByClientId' });
            throw apiError;
        }
    }

    public async list(options: ListShipperClientsOptions = {}): Promise<PaginatedShipperClients> {
        try {
            const shipperId = this.requireUserId();
            const { page = 1, limit = 20, search } = options;
            const offset = (page - 1) * limit;

            if (!this.userCan.canList(Resources.SHIPPER_CLIENTS)) {
                throw new ForbiddenError('You are not authorized to list clients');
            }

            const baseConditions = this.userCan.isAdmin()
                ? [isNull(shipperClients.deletedAt)]
                : [eq(shipperClients.shipperId, shipperId), isNull(shipperClients.deletedAt)];

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

            const [{ total }] = await this.db
                .select({ total: count() })
                .from(shipperClients)
                .innerJoin(user, eq(shipperClients.clientId, user.id))
                .where(whereConditions);

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
                        phoneCountryCode: user.phoneCountryCode,
                        phoneNumber: user.phoneNumber,
                    },
                })
                .from(shipperClients)
                .innerJoin(user, eq(shipperClients.clientId, user.id))
                .where(whereConditions)
                .orderBy(desc(shipperClients.createdAt))
                .limit(limit)
                .offset(offset);

            return {
                data: results.map((r) => shipperClientResponseSchema.parse(r)),
                total,
                page,
                limit,
                hasMore: offset + results.length < total,
            };
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'ShipperClientService.list' });
            throw apiError;
        }
    }

    public async update(clientId: string, input: UpdateShipperClientInput): Promise<ShipperClientResponse> {
        try {
            const shipperId = this.requireUserId();

            await this.getByClientId(clientId);

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

            this.log('shipper_client_update', { clientId, updates: Object.keys(input) });

            return this.getByClientId(clientId);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'ShipperClientService.update' });
            throw apiError;
        }
    }

    public async remove(clientId: string): Promise<void> {
        try {
            const shipperId = this.requireUserId();

            await this.getByClientId(clientId);

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

            this.log('shipper_client_remove', { clientId });
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'ShipperClientService.remove' });
            throw apiError;
        }
    }

    private async validateClientUser(clientUserId: string): Promise<void> {
        const [clientUser] = await this.db
            .select()
            .from(user)
            .where(eq(user.id, clientUserId))
            .limit(1);

        if (!clientUser) {
            throw new NotFoundError('Client user not found');
        }

        if (clientUser.role !== UserRoles.CLIENT) {
            throw new BadRequestError('User is not a client');
        }
    }

    private async findExistingRelationship(
        shipperId: string,
        clientId: string
    ): Promise<typeof shipperClients.$inferSelect | null> {
        const [existing] = await this.db
            .select()
            .from(shipperClients)
            .where(
                and(
                    eq(shipperClients.shipperId, shipperId),
                    eq(shipperClients.clientId, clientId)
                )
            )
            .limit(1);

        return existing ?? null;
    }

    private async fetchShipperClientWithUser(
        shipperId: string,
        clientId: string
    ): Promise<ShipperClientWithUser | null> {
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
                    phoneCountryCode: user.phoneCountryCode,
                    phoneNumber: user.phoneNumber,
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

        return results[0] ?? null;
    }
}
