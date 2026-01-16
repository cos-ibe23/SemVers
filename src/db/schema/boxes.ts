import { pgTable, serial, text, varchar, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { user } from './auth';
import { timestamps } from './helpers';
import { BOX_STATUSES } from '../../constants/enums';

export const boxStatusEnum = pgEnum('box_status', BOX_STATUSES);

export const boxes = pgTable('boxes', {
    id: serial('id').primaryKey(),
    ownerUserId: text('owner_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    createdByUserId: text('created_by_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 100 }),
    estimatedWeightLb: decimal('estimated_weight_lb', { precision: 8, scale: 2 }),
    actualWeightLb: decimal('actual_weight_lb', { precision: 8, scale: 2 }),
    shipperRatePerLb: decimal('shipper_rate_per_lb', { precision: 10, scale: 2 }),
    insuranceUsd: decimal('insurance_usd', { precision: 10, scale: 2 }).default('0'),
    status: boxStatusEnum('status').default('OPEN'),
    deliveredAt: timestamp('delivered_at'),
    ...timestamps(),
});

// Zod schemas
// Zod schemas
export const selectBoxSchema = createSelectSchema(boxes);
export const insertBoxSchema = createInsertSchema(boxes);
export const patchBoxSchema = insertBoxSchema.partial();

// API Schemas
export const boxResponseSchema = z.object({
    id: z.number(),
    ownerUserId: z.string(),
    createdByUserId: z.string(),
    label: z.string().nullable(),
    estimatedWeightLb: z.string().nullable(),
    actualWeightLb: z.string().nullable(),
    shipperRatePerLb: z.string().nullable(),
    insuranceUsd: z.string().nullable(),
    status: z.enum(BOX_STATUSES).nullable(),
    deliveredAt: z.string().nullable(), // Timestamp returned as string usually
    createdAt: z.date(),
    updatedAt: z.date(),
    isTransferred: z.boolean().optional(),
    pickups: z.array(z.any()).optional(), 
    items: z.array(z.any()).optional(),
});

export const createBoxBodySchema = z.object({
    label: z.string().min(1).max(100),
    shipperRatePerLb: z.number().nonnegative().optional(),
    insuranceUsd: z.number().nonnegative().optional(),
    pickupIds: z.array(z.number()).optional(),
});

export const updateBoxBodySchema = z.object({
    label: z.string().min(1).max(100).optional(),
    shipperRatePerLb: z.number().nonnegative().optional(),
    insuranceUsd: z.number().nonnegative().optional(),
    status: z.enum(BOX_STATUSES).optional(),
    actualWeightLb: z.number().nonnegative().optional(),
});

