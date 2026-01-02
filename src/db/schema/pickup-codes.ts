import { pgTable, serial, text, integer, varchar, timestamp } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';
import { boxes } from './boxes';
import { timestamps } from './helpers';

export const pickupCodes = pgTable('pickup_codes', {
    id: serial('id').primaryKey(),
    boxId: integer('box_id')
        .notNull()
        .references(() => boxes.id, { onDelete: 'cascade' }),
    clientUserId: text('client_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 20 }).notNull(),
    usedAt: timestamp('used_at'),
    ...timestamps(),
});

// Zod schemas
export const selectPickupCodeSchema = createSelectSchema(pickupCodes);
export const insertPickupCodeSchema = createInsertSchema(pickupCodes);
