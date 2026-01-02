import { pgTable, text, varchar, primaryKey } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { user } from './auth';
import { timestamps } from './helpers';

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
        ...timestamps(),
    },
    (table) => [primaryKey({ columns: [table.shipperId, table.clientId] })]
);

// Zod schemas
export const selectShipperClientSchema = createSelectSchema(shipperClients);
export const insertShipperClientSchema = createInsertSchema(shipperClients);
export const patchShipperClientSchema = insertShipperClientSchema.partial();

// Response schema for client user data
export const clientUserResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
});

// Response schema for shipper-client with nested user
export const shipperClientResponseSchema = z.object({
    shipperId: z.string(),
    clientId: z.string(),
    nickname: z.string().nullable(),
    phone: z.string().nullable(),
    createdAt: z.coerce.date().transform((d) => d.toISOString()),
    client: clientUserResponseSchema,
});

export type ShipperClientResponse = z.infer<typeof shipperClientResponseSchema>;

// Request schemas for shipper-client endpoints
export const addClientRequestSchema = z
    .object({
        clientUserId: z.string().optional(),
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().optional(),
        nickname: z.string().max(255).optional(),
        phone: z.string().max(50).optional(),
    })
    .refine((data) => data.clientUserId || (data.name && data.email), {
        message: 'Either clientUserId or both name and email are required',
    });

export const updateClientRequestSchema = z.object({
    nickname: z.string().max(255).nullable().optional(),
    phone: z.string().max(50).nullable().optional(),
});
