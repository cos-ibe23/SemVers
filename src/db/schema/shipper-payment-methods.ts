import { pgTable, serial, text, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';
import { paymentMethodEnum } from './payment-proofs';

export const shipperPaymentMethods = pgTable('shipper_payment_methods', {
    id: serial('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    type: paymentMethodEnum('type').notNull(),
    handle: varchar('handle', { length: 255 }).notNull(), // email, $cashtag, phone, etc.
    instructions: text('instructions'), // "Send to xyz@email.com with your name in memo"
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Zod schemas
export const selectShipperPaymentMethodSchema = createSelectSchema(shipperPaymentMethods);
export const insertShipperPaymentMethodSchema = createInsertSchema(shipperPaymentMethods);
export const patchShipperPaymentMethodSchema = insertShipperPaymentMethodSchema.partial();
