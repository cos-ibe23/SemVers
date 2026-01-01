import type { User } from '../../src/db/auth';

let userIdCounter = 1;

export interface CreateUserOptions {
    id?: string;
    name?: string;
    email?: string;
    emailVerified?: boolean;
    image?: string | null;
    role?: string;
}

/**
 * Factory for creating test users
 */
export class UserFactory {
    private users: User[] = [];

    /**
     * Create a test user
     */
    create(options: CreateUserOptions = {}): User {
        const id = options.id ?? `test-user-${userIdCounter++}`;
        const user: User = {
            id,
            name: options.name ?? `Test User ${userIdCounter}`,
            email: options.email ?? `test${userIdCounter}@example.com`,
            emailVerified: options.emailVerified ?? true,
            image: options.image ?? null,
            role: options.role ?? 'SHIPPER',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.users.push(user);
        return user;
    }

    /**
     * Create a shipper user
     */
    createShipper(options: Omit<CreateUserOptions, 'role'> = {}): User {
        return this.create({ ...options, role: 'SHIPPER' });
    }

    /**
     * Create an admin user
     */
    createAdmin(options: Omit<CreateUserOptions, 'role'> = {}): User {
        return this.create({ ...options, role: 'ADMIN' });
    }

    /**
     * Get all created users
     */
    getAll(): User[] {
        return [...this.users];
    }

    /**
     * Clear all created users
     */
    clear(): void {
        this.users = [];
    }
}

// Singleton instance for convenience
export const userFactory = new UserFactory();
