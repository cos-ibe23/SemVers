import { randomUUID } from 'crypto';
import { user } from '../../src/db/schema';
import { UserRoles, type UserRole } from '../../src/permissions/types';
import { getTestDb, type TestDb } from '../helpers';

export type User = typeof user.$inferSelect;

let userIdCounter = 1;

export interface CreateUserOptions {
    id?: string;
    name?: string;
    email?: string;
    emailVerified?: boolean;
    image?: string | null;
    role?: UserRole;
    // Business fields
    businessName?: string | null;
    logoUrl?: string | null;
    street?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    phoneCountryCode?: string | null;
    phoneNumber?: string | null;
    requestSlug?: string | null;
    onboardedAt?: Date | null;
}

/**
 * Factory for creating test users in the database
 */
export class UserFactory {
    private db: TestDb;

    constructor(db?: TestDb) {
        this.db = db ?? getTestDb();
    }

    /**
     * Create a test user in the database
     */
    async create(options: CreateUserOptions = {}): Promise<User> {
        const counter = userIdCounter++;
        // Use UUID to avoid collisions in parallel tests
        const uniqueId = randomUUID().slice(0, 8);
        const id = options.id ?? `test-user-${uniqueId}`;

        const [created] = await this.db
            .insert(user)
            .values({
                id,
                name: options.name ?? `Test User ${counter}`,
                email: options.email ?? `test-${uniqueId}@example.com`,
                emailVerified: options.emailVerified ?? true,
                image: options.image ?? null,
                role: options.role ?? UserRoles.SHIPPER,
                // Business fields
                businessName: options.businessName ?? null,
                logoUrl: options.logoUrl ?? null,
                street: options.street ?? null,
                city: options.city ?? null,
                state: options.state ?? null,
                country: options.country ?? null,
                phoneCountryCode: options.phoneCountryCode ?? null,
                phoneNumber: options.phoneNumber ?? null,
                requestSlug: options.requestSlug ?? null,
                onboardedAt: options.onboardedAt ?? null,
            })
            .returning();

        return created;
    }

    /**
     * Create a shipper user in the database (not onboarded)
     */
    async createShipper(options: Omit<CreateUserOptions, 'role'> = {}): Promise<User> {
        return this.create({ ...options, role: UserRoles.SHIPPER });
    }

    /**
     * Create a shipper user with business fields set (onboarded)
     */
    async createOnboardedShipper(options: Omit<CreateUserOptions, 'role' | 'onboardedAt'> = {}): Promise<User> {
        const uniqueId = randomUUID().slice(0, 8);
        return this.create({
            ...options,
            role: UserRoles.SHIPPER,
            businessName: options.businessName ?? 'Test Business',
            requestSlug: options.requestSlug ?? `test-business-${uniqueId}`,
            onboardedAt: new Date(),
        });
    }

    /**
     * Create a client user in the database
     */
    async createClient(options: Omit<CreateUserOptions, 'role'> = {}): Promise<User> {
        return this.create({ ...options, role: UserRoles.CLIENT });
    }

    /**
     * Create an admin user in the database
     */
    async createAdmin(options: Omit<CreateUserOptions, 'role'> = {}): Promise<User> {
        return this.create({ ...options, role: UserRoles.ADMIN });
    }

    /**
     * Reset the counter (call in beforeEach)
     */
    static resetCounter(): void {
        userIdCounter = 1;
    }
}

/**
 * Create a user factory instance
 * Use this in tests: const userFactory = createUserFactory();
 */
export function createUserFactory(db?: TestDb): UserFactory {
    return new UserFactory(db);
}

// Legacy singleton for simple tests (deprecated - use createUserFactory instead)
export const userFactory = {
    create: (options: CreateUserOptions = {}) => {
        const counter = userIdCounter++;
        const id = options.id ?? `test-user-${counter}`;
        return {
            id,
            name: options.name ?? `Test User ${counter}`,
            email: options.email ?? `test${counter}@example.com`,
            emailVerified: options.emailVerified ?? true,
            image: options.image ?? null,
            role: options.role ?? UserRoles.SHIPPER,
            businessName: options.businessName ?? null,
            logoUrl: options.logoUrl ?? null,
            street: options.street ?? null,
            city: options.city ?? null,
            state: options.state ?? null,
            country: options.country ?? null,
            phoneCountryCode: options.phoneCountryCode ?? null,
            phoneNumber: options.phoneNumber ?? null,
            requestSlug: options.requestSlug ?? null,
            onboardedAt: options.onboardedAt ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as User;
    },
    createShipper: (options: Omit<CreateUserOptions, 'role'> = {}) => {
        return userFactory.create({ ...options, role: UserRoles.SHIPPER });
    },
    createClient: (options: Omit<CreateUserOptions, 'role'> = {}) => {
        return userFactory.create({ ...options, role: UserRoles.CLIENT });
    },
    createAdmin: (options: Omit<CreateUserOptions, 'role'> = {}) => {
        return userFactory.create({ ...options, role: UserRoles.ADMIN });
    },
    clear: () => {
        userIdCounter = 1;
    },
};
