import { pgTable, text, varchar, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';

/**
 * Shipper-Client relationship table
 *
 * Links shippers to their clients. Both shipper and client are users.
 * A shipper can have many clients, and a client can belong to multiple shippers.
 */
export const shipperClients = pgTable(
    'shipper_clients',
    {
        shipperId: text('shipper_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        clientId: text('client_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        // Optional alias/nickname for this client (shipper-specific)
        nickname: varchar('nickname', { length: 255 }),
        // Optional phone override (client may share different number with each shipper)
        phone: varchar('phone', { length: 50 }),
        deletedAt: timestamp('deleted_at'), // soft delete
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (table) => [primaryKey({ columns: [table.shipperId, table.clientId] })]
);

// Zod schemas
export const selectShipperClientSchema = createSelectSchema(shipperClients);
export const insertShipperClientSchema = createInsertSchema(shipperClients);
export const patchShipperClientSchema = insertShipperClientSchema.partial();
