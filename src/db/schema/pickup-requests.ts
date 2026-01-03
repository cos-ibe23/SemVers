import { pgTable, serial, text, integer, varchar, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { user } from './auth';
import { pickups } from './pickups';
import { currencyEnum } from './fx-rates';
import { timestamps } from './helpers';

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

    // Shipper who receives this request
    shipperUserId: text('shipper_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),

    // Client who submitted the request (auto-created from email)
    clientUserId: text('client_user_id').references(() => user.id, { onDelete: 'set null' }),

    // Client info (kept for display even if user is deleted)
    consumerName: varchar('consumer_name', { length: 255 }).notNull(),
    consumerEmail: varchar('consumer_email', { length: 255 }),
    consumerPhone: varchar('consumer_phone', { length: 50 }),

    // Pickup details
    numberOfItems: integer('number_of_items').notNull().default(1),
    meetupLocation: text('meetup_location').notNull(),
    pickupTime: timestamp('pickup_time').notNull(),

    // Price fields
    agreedPrice: decimal('agreed_price', { precision: 10, scale: 2 }),
    agreedPriceCurrency: currencyEnum('agreed_price_currency').default('USD'),

    // Item description (free-form)
    itemDescription: text('item_description'),

    // Marketplace links (comma-separated URLs)
    links: text('links'),

    // Seller info (not a user, just contact details)
    sellerName: varchar('seller_name', { length: 255 }),
    sellerPhone: varchar('seller_phone', { length: 50 }),

    // IMEIs (comma-separated, optional - can be filled after pickup)
    imeis: text('imeis'),

    // Status and payment
    status: pickupRequestStatusEnum('status').default('PENDING'),
    estimatedQuoteUsd: decimal('estimated_quote_usd', { precision: 10, scale: 2 }),
    paymentStatus: paymentStatusEnum('payment_status').default('UNPAID'),

    // Conversion tracking
    convertedPickupId: integer('converted_pickup_id').references(() => pickups.id, { onDelete: 'set null' }),

    ...timestamps(),
});

// Items in a pickup request (optional detailed breakdown)
export const pickupRequestItems = pgTable('pickup_request_items', {
    id: serial('id').primaryKey(),
    requestId: integer('request_id')
        .notNull()
        .references(() => pickupRequests.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 100 }),
    description: text('description'),
    marketplaceUrl: varchar('marketplace_url', { length: 512 }),
    budgetUsd: decimal('budget_usd', { precision: 10, scale: 2 }),
    ...timestamps(),
});

// Zod schemas
export const selectPickupRequestSchema = createSelectSchema(pickupRequests);
export const insertPickupRequestSchema = createInsertSchema(pickupRequests);
export const patchPickupRequestSchema = insertPickupRequestSchema.partial();

export const selectPickupRequestItemSchema = createSelectSchema(pickupRequestItems);
export const insertPickupRequestItemSchema = createInsertSchema(pickupRequestItems);

// Response schema for API
export const pickupRequestResponseSchema = z.object({
    id: z.number(),
    shipperUserId: z.string(),
    clientUserId: z.string().nullable(),
    consumerName: z.string(),
    consumerEmail: z.string().nullable(),
    consumerPhone: z.string().nullable(),
    numberOfItems: z.number(),
    meetupLocation: z.string(),
    pickupTime: z.date(),
    agreedPrice: z.string().nullable(),
    agreedPriceCurrency: z.enum(['USD', 'NGN', 'GBP', 'EUR']).nullable(),
    itemDescription: z.string().nullable(),
    links: z.string().nullable(),
    sellerName: z.string().nullable(),
    sellerPhone: z.string().nullable(),
    imeis: z.string().nullable(),
    status: z.enum(['PENDING', 'QUOTED', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'ACCEPTED', 'REJECTED', 'CONVERTED']),
    estimatedQuoteUsd: z.string().nullable(),
    paymentStatus: z.enum(['UNPAID', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED']),
    convertedPickupId: z.number().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type PickupRequest = typeof pickupRequests.$inferSelect;
export type PickupRequestResponse = z.infer<typeof pickupRequestResponseSchema>;

// Public request form schema (for client submission)
export const createPickupRequestPublicSchema = z.object({
    // Client info (required)
    name: z.string().min(1).max(255),
    email: z.string().email(),
    phoneCountryCode: z.string().max(10).optional(),
    phoneNumber: z.string().max(20).optional(),

    // Pickup details (required)
    numberOfItems: z.number().int().min(1),
    meetupLocation: z.string().min(1),
    pickupTime: z.string().datetime(),

    // Seller info (optional)
    sellerName: z.string().max(255).optional(),
    sellerPhone: z.string().max(50).optional(),

    // Item details (optional)
    agreedPrice: z.number().positive().optional(),
    itemDescription: z.string().optional(),
    links: z.string().optional(),
    imeis: z.string().optional(),
});

// Shipper-initiated request schema
export const createPickupRequestShipperSchema = z.object({
    clientUserId: z.string().optional(),
    consumerName: z.string().min(1).max(255),
    consumerEmail: z.string().email().optional(),
    consumerPhone: z.string().max(50).optional(),
    numberOfItems: z.number().int().min(1),
    meetupLocation: z.string().min(1),
    pickupTime: z.string().datetime(),
    sellerName: z.string().max(255).optional(),
    sellerPhone: z.string().max(50).optional(),
    agreedPrice: z.number().positive().optional(),
    agreedPriceCurrency: z.enum(['USD', 'NGN', 'GBP', 'EUR']).default('USD'),
    itemDescription: z.string().optional(),
    links: z.string().optional(),
    imeis: z.string().optional(),
});

// Update request schema
export const updatePickupRequestSchema = z.object({
    consumerName: z.string().min(1).max(255).optional(),
    consumerEmail: z.string().email().optional(),
    consumerPhone: z.string().max(50).optional(),
    numberOfItems: z.number().int().min(1).optional(),
    meetupLocation: z.string().min(1).optional(),
    pickupTime: z.string().datetime().optional(),
    sellerName: z.string().max(255).nullable().optional(),
    sellerPhone: z.string().max(50).nullable().optional(),
    agreedPrice: z.number().positive().nullable().optional(),
    itemDescription: z.string().nullable().optional(),
    links: z.string().nullable().optional(),
    imeis: z.string().nullable().optional(),
    status: z.enum(['PENDING', 'QUOTED', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'ACCEPTED', 'REJECTED', 'CONVERTED']).optional(),
    estimatedQuoteUsd: z.number().positive().nullable().optional(),
});
