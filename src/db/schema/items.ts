import { pgTable, serial, integer, varchar, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { pickups } from './pickups';
import { boxes } from './boxes';
import { fxRates } from './fx-rates';
import { timestamps } from './helpers';

export const itemStatusEnum = pgEnum('item_status', [
    'PENDING',      // In pickup, not yet in box
    'IN_BOX',       // Assigned to box, not shipped
    'IN_TRANSIT',   // Box shipped
    'DELIVERED',    // Box delivered, awaiting client pickup
    'HANDED_OFF',   // Client received item (pickup code used)
    'SOLD',         // Item sold by client (optional tracking)
    'RETURNED',     // Item returned
]);

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
