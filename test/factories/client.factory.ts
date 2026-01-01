import type { clients } from '../../src/db/schema';

let clientIdCounter = 1;

export type Client = typeof clients.$inferSelect;

export interface CreateClientOptions {
    id?: number;
    ownerUserId: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
}

/**
 * Factory for creating test clients
 */
export class ClientFactory {
    private clients: Client[] = [];

    /**
     * Create a test client
     */
    create(options: CreateClientOptions): Client {
        const id = options.id ?? clientIdCounter++;
        const client: Client = {
            id,
            ownerUserId: options.ownerUserId,
            name: options.name ?? `Test Client ${id}`,
            email: options.email ?? `client${id}@example.com`,
            phone: options.phone ?? null,
            avatarUrl: options.avatarUrl ?? null,
            deletedAt: null,
            createdAt: new Date(),
        };

        this.clients.push(client);
        return client;
    }

    /**
     * Create multiple clients
     */
    createMany(ownerUserId: string, count: number): Client[] {
        return Array.from({ length: count }, () =>
            this.create({ ownerUserId })
        );
    }

    /**
     * Get all created clients
     */
    getAll(): Client[] {
        return [...this.clients];
    }

    /**
     * Get clients by owner
     */
    getByOwner(ownerUserId: string): Client[] {
        return this.clients.filter(c => c.ownerUserId === ownerUserId);
    }

    /**
     * Clear all created clients
     */
    clear(): void {
        this.clients = [];
        clientIdCounter = 1;
    }
}

// Singleton instance for convenience
export const clientFactory = new ClientFactory();
