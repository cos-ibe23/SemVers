import { pgTable, serial, integer, varchar, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { pickups } from './pickups';
import { boxes } from './boxes';
import { fxRates } from './fx-rates';
import { timestamps } from './helpers';
import { ITEM_STATUSES, IMEI_SOURCES } from '../../constants/enums';

export const itemStatusEnum = pgEnum('item_status', ITEM_STATUSES);

export const items = pgTable('items', {
    id: serial('id').primaryKey(),
    pickupId: integer('pickup_id')
        .notNull()
        .references(() => pickups.id, { onDelete: 'cascade' }),
    boxId: integer('box_id')
        .references(() => boxes.id, { onDelete: 'set null' }),
    category: varchar('category', { length: 100 }).notNull(),
    model: varchar('model', { length: 255 }),
    imei: varchar('imei', { length: 50 }),
    imeiSource: varchar('imei_source', { length: 50 }), // 'manual', 'scanned', 'api'
    estimatedWeightLb: decimal('estimated_weight_lb', { precision: 8, scale: 2 }).default('0'),
    clientShippingUsd: decimal('client_shipping_usd', { precision: 10, scale: 2 }).default('0'),
    serviceFeeUsd: decimal('service_fee_usd', { precision: 10, scale: 2 }).default('0'),
    clientPaidNgn: decimal('client_paid_ngn', { precision: 15, scale: 2 }),
    fxRateId: integer('fx_rate_id')
        .references(() => fxRates.id),
    allocatedShipperUsd: decimal('allocated_shipper_usd', { precision: 10, scale: 2 }),
    status: itemStatusEnum('status').default('PENDING'),
    ...timestamps(),
});

// Zod schemas
export const selectItemSchema = createSelectSchema(items);
export const insertItemSchema = createInsertSchema(items);
export const patchItemSchema = insertItemSchema.partial();

// Types
export type Item = typeof items.$inferSelect;

// Response schema for API
export const itemResponseSchema = z.object({
    id: z.number(),
    pickupId: z.number(),
    boxId: z.number().nullable(),
    category: z.string(),
    model: z.string().nullable(),
    imei: z.string().nullable(),
    imeiSource: z.string().nullable(),
    estimatedWeightLb: z.string().nullable(),
    clientShippingUsd: z.string().nullable(),
    serviceFeeUsd: z.string().nullable(),
    clientPaidNgn: z.string().nullable(),
    fxRateId: z.number().nullable(),
    allocatedShipperUsd: z.string().nullable(),
    status: z.enum(ITEM_STATUSES).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type ItemResponse = z.infer<typeof itemResponseSchema>;

export const itemTemplateSchema = z.object({
    id: z.string(),
    category: z.string(),
    estimatedWeightLb: z.number(),
    shippingCostUsd: z.number(),
});

export type ItemTemplate = z.infer<typeof itemTemplateSchema>;

// Request schemas
export const createItemRequestSchema = z.object({
    category: z.string().min(1).max(100),
    model: z.string().max(255).optional(),
    imei: z.string().max(50).optional(),
    imeiSource: z.enum(IMEI_SOURCES).optional(),
    estimatedWeightLb: z.number().nonnegative().optional(),
    clientShippingUsd: z.number().nonnegative().optional(),
});

export const updateItemRequestSchema = z.object({
    category: z.string().min(1).max(100).optional(),
    model: z.string().max(255).nullable().optional(),
    imei: z.string().max(50).nullable().optional(),
    imeiSource: z.enum(IMEI_SOURCES).nullable().optional(),
    estimatedWeightLb: z.number().nonnegative().optional(),
    clientShippingUsd: z.number().nonnegative().optional(),
    status: z.enum(ITEM_STATUSES).optional(),
});
