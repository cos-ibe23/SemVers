import { pgTable, serial, text, integer, decimal, date, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { user } from './auth';
import { fxRates } from './fx-rates';
import { timestamps } from './helpers';
import { PICKUP_STATUSES } from '../../constants/enums';

export const pickupStatusEnum = pgEnum('pickup_status', PICKUP_STATUSES);

export const pickups = pgTable('pickups', {
    id: serial('id').primaryKey(),
    ownerUserId: text('owner_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    clientUserId: text('client_user_id')
        .references(() => user.id, { onDelete: 'cascade' }),
    pickupFeeUsd: decimal('pickup_fee_usd', { precision: 10, scale: 2 }).default('0'),
    itemPriceUsd: decimal('item_price_usd', { precision: 10, scale: 2 }).default('0'),
    notes: text('notes'),
    pickupDate: date('pickup_date'),
    status: pickupStatusEnum('status').default('DRAFT'),
    sourceRequestId: integer('source_request_id'),
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
    clientUserId: z.string().nullable(),
    pickupFeeUsd: z.string().nullable(),
    itemPriceUsd: z.string().nullable(),
    notes: z.string().nullable(),
    pickupDate: z.string().nullable(),
    status: z.enum(PICKUP_STATUSES).nullable(),
    sourceRequestId: z.number().nullable(),
    fxRateId: z.number().nullable(),
    totalPriceUsd: z.string(),
    totalWeightLb: z.string(),
    items: z.array(z.object({
        id: z.number(),
        pickupId: z.number(),
        boxId: z.number().nullable(),
        category: z.string(),
        model: z.string().nullable(),
        imei: z.string().nullable(),
        estimatedWeightLb: z.string().nullable(),
        clientShippingUsd: z.string().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
    })),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type PickupResponse = z.infer<typeof pickupResponseSchema>;

// Request schemas for pickups
export const createPickupBodySchema = z.object({
    clientUserId: z.string().optional(),
    pickupFeeUsd: z.number().nonnegative().optional(),
    itemPriceUsd: z.number().nonnegative().optional(),
    notes: z.string().optional(),
    pickupDate: z.string().optional(), // ISO date string
    fxRateId: z.number().optional(),
    items: z.array(z.object({
        category: z.string().min(1).max(100),
        model: z.string().max(255).optional(),
        imei: z.string().max(50).optional(),
        estimatedWeightLb: z.number().nonnegative().optional(),
        clientShippingUsd: z.number().nonnegative().optional(),
    })).optional(),
    sourceRequestId: z.number().optional(),
});

export const updatePickupBodySchema = z.object({
    pickupFeeUsd: z.number().nonnegative().optional(),
    itemPriceUsd: z.number().nonnegative().optional(),
    notes: z.string().nullable().optional(),
    pickupDate: z.string().nullable().optional(),
    status: z.enum(PICKUP_STATUSES).optional(),
    fxRateId: z.number().nullable().optional(),
    items: z.array(z.object({
        id: z.number().optional(), // Optional ID for updates, missing for creation
        category: z.string().min(1).max(100),
        model: z.string().max(255).optional(),
        imei: z.string().max(50).optional(),
        estimatedWeightLb: z.number().nonnegative().optional(),
        clientShippingUsd: z.number().nonnegative().optional(),
    })).optional(),
});
