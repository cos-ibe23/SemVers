import { timestamp } from 'drizzle-orm/pg-core';

/**
 * Common timestamp fields for all tables
 * Use with spread operator: ...timestamps()
 */
export function timestamps() {
    return {
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
        deletedAt: timestamp('deleted_at'), // Soft delete
    } as const;
}

