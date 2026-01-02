import type { user } from '../../src/db/schema';

let clientIdCounter = 1;

export type User = typeof user.$inferSelect;

export interface CreateClientOptions {
    id?: string;
    name?: string;
    email?: string;
    image?: string | null;
}

/**
 * Factory for creating test client users
 * Clients are users with role = 'CLIENT'
 */
export class ClientFactory {
    private clients: User[] = [];

    /**
     * Create a test client user
     */
    create(options: CreateClientOptions = {}): User {
        const counter = clientIdCounter++;
        const id = options.id ?? `client-${counter}`;
        const client: User = {
            id,
            name: options.name ?? `Test Client ${counter}`,
            email: options.email ?? `client${counter}@example.com`,
            emailVerified: false,
            image: options.image ?? null,
            role: 'CLIENT',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.clients.push(client);
        return client;
    }

    /**
     * Create multiple clients
     */
    createMany(count: number): User[] {
        return Array.from({ length: count }, () => this.create());
    }

    /**
     * Get all created clients
     */
    getAll(): User[] {
        return [...this.clients];
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
