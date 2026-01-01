import { pgTable, serial, text, varchar, decimal, timestamp } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';

export const pickupTemplates = pgTable('pickup_templates', {
    id: serial('id').primaryKey(),
    ownerUserId: text('owner_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }),
    defaultPickupFeeUsd: decimal('default_pickup_fee_usd', { precision: 10, scale: 2 }),
    defaultClientShippingUsd: decimal('default_client_shipping_usd', { precision: 10, scale: 2 }),
    defaultServiceFeeUsd: decimal('default_service_fee_usd', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Zod schemas
export const selectPickupTemplateSchema = createSelectSchema(pickupTemplates);
export const insertPickupTemplateSchema = createInsertSchema(pickupTemplates);
export const patchPickupTemplateSchema = insertPickupTemplateSchema.partial();
