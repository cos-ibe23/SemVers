import { randomUUID } from 'crypto';
import { user, shipperClients } from '../../src/db/schema';
import { UserRoles } from '../../src/permissions/types';
import { getTestDb, type TestDb } from '../helpers';

export type User = typeof user.$inferSelect;
export type ShipperClient = typeof shipperClients.$inferSelect;

let clientIdCounter = 1;

export interface CreateClientUserOptions {
    id?: string;
    name?: string;
    email?: string;
    image?: string | null;
}

export interface CreateShipperClientOptions {
    shipperId: string;
    clientId: string;
    nickname?: string | null;
    phone?: string | null;
}

/**
 * Factory for creating test client users and shipper-client relationships
 */
export class ClientFactory {
    private db: TestDb;

    constructor(db?: TestDb) {
        this.db = db ?? getTestDb();
    }

    /**
     * Create a client user in the database
     */
    async createUser(options: CreateClientUserOptions = {}): Promise<User> {
        const counter = clientIdCounter++;
        // Use UUID to avoid collisions in parallel tests
        const uniqueId = randomUUID().slice(0, 8);
        const id = options.id ?? `client-${uniqueId}`;

        const [created] = await this.db
            .insert(user)
            .values({
                id,
                name: options.name ?? `Test Client ${counter}`,
                email: options.email ?? `client-${uniqueId}@example.com`,
                emailVerified: false,
                image: options.image ?? null,
                role: UserRoles.CLIENT,
            })
            .returning();

        return created;
    }

    /**
     * Create a shipper-client relationship in the database
     */
    async createRelationship(options: CreateShipperClientOptions): Promise<ShipperClient> {
        const [created] = await this.db
            .insert(shipperClients)
            .values({
                shipperId: options.shipperId,
                clientId: options.clientId,
                nickname: options.nickname ?? null,
                phone: options.phone ?? null,
            })
            .returning();

        return created;
    }

    /**
     * Create a client user and link to shipper in one call
     */
    async createForShipper(
        shipperId: string,
        options: CreateClientUserOptions & { nickname?: string | null; phone?: string | null } = {}
    ): Promise<{ user: User; relationship: ShipperClient }> {
        const clientUser = await this.createUser(options);
        const relationship = await this.createRelationship({
            shipperId,
            clientId: clientUser.id,
            nickname: options.nickname,
            phone: options.phone,
        });

        return { user: clientUser, relationship };
    }

    /**
     * Reset the counter
     */
    static resetCounter(): void {
        clientIdCounter = 1;
    }
}

/**
 * Create a client factory instance
 */
export function createClientFactory(db?: TestDb): ClientFactory {
    return new ClientFactory(db);
}

// Legacy singleton (deprecated - for backwards compatibility)
export const clientFactory = {
    clear: () => {
        clientIdCounter = 1;
    },
};
