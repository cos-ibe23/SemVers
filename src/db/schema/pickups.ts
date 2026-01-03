import { pgTable, serial, text, integer, decimal, date, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { user } from './auth';
import { fxRates } from './fx-rates';
import { timestamps } from './helpers';

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

    // FX rate used for this pickup (snapshot at time of conversion/creation)
    fxRateId: integer('fx_rate_id').references(() => fxRates.id, { onDelete: 'set null' }),

    ...timestamps(),
});

// Zod schemas
export const selectPickupSchema = createSelectSchema(pickups);
export const insertPickupSchema = createInsertSchema(pickups);
export const patchPickupSchema = insertPickupSchema.partial();

// Types
export type Pickup = typeof pickups.$inferSelect;

// Response schema for API
export const pickupResponseSchema = z.object({
    id: z.number(),
    ownerUserId: z.string(),
    clientUserId: z.string(),
    pickupFeeUsd: z.string().nullable(),
    itemPriceUsd: z.string().nullable(),
    notes: z.string().nullable(),
    pickupDate: z.string().nullable(),
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).nullable(),
    sourceRequestId: z.number().nullable(),
    fxRateId: z.number().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type PickupResponse = z.infer<typeof pickupResponseSchema>;

// Request schemas for pickups
export const createPickupBodySchema = z.object({
    clientUserId: z.string(),
    pickupFeeUsd: z.number().nonnegative().optional(),
    itemPriceUsd: z.number().nonnegative().optional(),
    notes: z.string().optional(),
    pickupDate: z.string().optional(), // ISO date string
    fxRateId: z.number().optional(),
});

export const updatePickupBodySchema = z.object({
    pickupFeeUsd: z.number().nonnegative().optional(),
    itemPriceUsd: z.number().nonnegative().optional(),
    notes: z.string().nullable().optional(),
    pickupDate: z.string().nullable().optional(),
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
    fxRateId: z.number().nullable().optional(),
});
