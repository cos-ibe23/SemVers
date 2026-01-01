import { pgTable, serial, integer, varchar, timestamp } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { boxes } from './boxes';
import { clients } from './clients';

export const pickupCodes = pgTable('pickup_codes', {
    id: serial('id').primaryKey(),
    boxId: integer('box_id')
        .notNull()
        .references(() => boxes.id, { onDelete: 'cascade' }),
    clientId: integer('client_id')
        .notNull()
        .references(() => clients.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 20 }).notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Zod schemas
export const selectPickupCodeSchema = createSelectSchema(pickupCodes);
export const insertPickupCodeSchema = createInsertSchema(pickupCodes);
