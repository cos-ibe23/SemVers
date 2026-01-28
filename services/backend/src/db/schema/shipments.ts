import { pgTable, serial, text, integer, varchar, date, timestamp, pgEnum, primaryKey } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';
import { boxes } from './boxes';
import { timestamps } from './helpers';
import { SHIPMENT_STATUSES } from '../../constants/enums';

export const shipmentStatusEnum = pgEnum('shipment_status', SHIPMENT_STATUSES);

export const shipments = pgTable('shipments', {
    id: serial('id').primaryKey(),
    ownerUserId: text('owner_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    carrier: varchar('carrier', { length: 100 }), // DHL, FedEx, etc.
    trackingNumber: varchar('tracking_number', { length: 100 }),
    shipDate: date('ship_date'),
    estimatedArrival: date('estimated_arrival'),
    actualArrival: date('actual_arrival'),
    status: shipmentStatusEnum('status').default('PENDING'),
    ...timestamps(),
});

// Junction table for boxes in shipments (many-to-many)
export const boxShipments = pgTable('box_shipments', {
    boxId: integer('box_id')
        .notNull()
        .references(() => boxes.id, { onDelete: 'cascade' }),
    shipmentId: integer('shipment_id')
        .notNull()
        .references(() => shipments.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.boxId, table.shipmentId] }),
}));

// Zod schemas
export const selectShipmentSchema = createSelectSchema(shipments);
export const insertShipmentSchema = createInsertSchema(shipments);
export const patchShipmentSchema = insertShipmentSchema.partial();
