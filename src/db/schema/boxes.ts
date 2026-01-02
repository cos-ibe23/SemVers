import { pgTable, serial, text, varchar, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';
import { timestamps } from './helpers';

export const boxStatusEnum = pgEnum('box_status', ['OPEN', 'SEALED', 'SHIPPED', 'DELIVERED']);

export const boxes = pgTable('boxes', {
    id: serial('id').primaryKey(),
    ownerUserId: text('owner_user_id')
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
export const selectBoxSchema = createSelectSchema(boxes);
export const insertBoxSchema = createInsertSchema(boxes);
export const patchBoxSchema = insertBoxSchema.partial();
