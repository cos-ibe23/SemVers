import { pgTable, serial, text, integer, decimal, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';

export const pickupStatusEnum = pgEnum('pickup_status', ['DRAFT', 'CONFIRMED', 'CANCELLED']);

export const pickups = pgTable('pickups', {
    id: serial('id').primaryKey(),
    ownerUserId: text('owner_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    clientUserId: text('client_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    pickupFeeUsd: decimal('pickup_fee_usd', { precision: 10, scale: 2 }).default('0'),
    itemPriceUsd: decimal('item_price_usd', { precision: 10, scale: 2 }).default('0'),
    notes: text('notes'),
    pickupDate: date('pickup_date'),
    status: pickupStatusEnum('status').default('DRAFT'),
    sourceRequestId: integer('source_request_id'), // references pickupRequests if converted
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Zod schemas
export const selectPickupSchema = createSelectSchema(pickups);
export const insertPickupSchema = createInsertSchema(pickups);
export const patchPickupSchema = insertPickupSchema.partial();
