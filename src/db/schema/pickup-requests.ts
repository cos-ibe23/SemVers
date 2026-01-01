import { pgTable, serial, text, integer, varchar, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';
import { pickups } from './pickups';

export const pickupRequestStatusEnum = pgEnum('pickup_request_status', [
    'PENDING',
    'QUOTED',
    'PAYMENT_SUBMITTED',
    'PAYMENT_VERIFIED',
    'ACCEPTED',
    'REJECTED',
    'CONVERTED',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
    'UNPAID',
    'PENDING_VERIFICATION',
    'VERIFIED',
    'REJECTED',
]);

export const pickupRequests = pgTable('pickup_requests', {
    id: serial('id').primaryKey(),
    shipperUserId: text('shipper_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    consumerName: varchar('consumer_name', { length: 255 }).notNull(),
    consumerEmail: varchar('consumer_email', { length: 255 }),
    consumerPhone: varchar('consumer_phone', { length: 50 }),
    status: pickupRequestStatusEnum('status').default('PENDING'),
    estimatedQuoteUsd: decimal('estimated_quote_usd', { precision: 10, scale: 2 }),
    paymentStatus: paymentStatusEnum('payment_status').default('UNPAID'),
    convertedPickupId: integer('converted_pickup_id')
        .references(() => pickups.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Items in a pickup request
export const pickupRequestItems = pgTable('pickup_request_items', {
    id: serial('id').primaryKey(),
    requestId: integer('request_id')
        .notNull()
        .references(() => pickupRequests.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 100 }),
    description: text('description'),
    marketplaceUrl: varchar('marketplace_url', { length: 512 }),
    budgetUsd: decimal('budget_usd', { precision: 10, scale: 2 }),
});

// Zod schemas
export const selectPickupRequestSchema = createSelectSchema(pickupRequests);
export const insertPickupRequestSchema = createInsertSchema(pickupRequests);
export const patchPickupRequestSchema = insertPickupRequestSchema.partial();

export const selectPickupRequestItemSchema = createSelectSchema(pickupRequestItems);
export const insertPickupRequestItemSchema = createInsertSchema(pickupRequestItems);
