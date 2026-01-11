import { pgTable, serial, text, integer, varchar, decimal, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { user } from './auth';
import { pickups } from './pickups';
import { currencyEnum } from './fx-rates';
import { timestamps } from './helpers';
import { PICKUP_REQUEST_STATUSES, CURRENCIES } from '../../constants/enums';

export const pickupRequestStatusEnum = pgEnum('pickup_request_status', PICKUP_REQUEST_STATUSES);

// Seller metadata type (flexible JSON structure)
export type SellerMetadata = {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
};

export const pickupRequests = pgTable('pickup_requests', {
    id: serial('id').primaryKey(),

    // Shipper who receives this request
    shipperUserId: text('shipper_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),

    // Client who submitted the request (auto-created from email)
    clientUserId: text('client_user_id').references(() => user.id, { onDelete: 'set null' }),

    // Client info (denormalized - kept for display even if user is deleted)
    clientName: varchar('client_name', { length: 255 }).notNull(),
    clientEmail: varchar('client_email', { length: 255 }),
    clientPhone: varchar('client_phone', { length: 50 }),

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

    // Seller info (flexible JSON - not a user, just contact details)
    sellerMetadata: jsonb('seller_metadata').$type<SellerMetadata>(),

    // IMEIs (comma-separated, optional - can be filled after pickup)
    imeis: text('imeis'),

    // Status
    status: pickupRequestStatusEnum('status').default('PENDING'),

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

// Seller metadata Zod schema
export const sellerMetadataSchema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
});

// Response schema for API
export const pickupRequestResponseSchema = z.object({
    id: z.number(),
    shipperUserId: z.string(),
    clientUserId: z.string().nullable(),
    clientName: z.string(),
    clientEmail: z.string().nullable(),
    clientPhone: z.string().nullable(),
    numberOfItems: z.number(),
    meetupLocation: z.string(),
    pickupTime: z.date(),
    agreedPrice: z.string().nullable(),
    agreedPriceCurrency: z.enum(CURRENCIES).nullable(),
    itemDescription: z.string().nullable(),
    links: z.string().nullable(),
    sellerMetadata: sellerMetadataSchema.nullable(),
    imeis: z.string().nullable(),
    status: z.enum(PICKUP_REQUEST_STATUSES),
    convertedPickupId: z.number().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type PickupRequest = typeof pickupRequests.$inferSelect;
export type PickupRequestResponse = z.infer<typeof pickupRequestResponseSchema>;

// Public request form schema (for client submission)
export const createPickupRequestPublicSchema = z.object({
    // Client info (optional - ignored/overridden by authenticated user profile)
    name: z.string().max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(), // Full phone number (e.g., "+1-555-123-4567")

    // Pickup details (required)
    numberOfItems: z.number().int().min(1),
    meetupLocation: z.string().min(1),
    pickupTime: z.string().datetime(),

    // Seller info (optional - stored as metadata)
    sellerMetadata: sellerMetadataSchema.optional(),

    // Item details (optional)
    agreedPrice: z.number().positive().optional(), // Always in USD for MVP
    itemDescription: z.string().optional(),
    links: z.string().optional(),
    imeis: z.string().optional(),
});

// Shipper-initiated request schema
export const createPickupRequestShipperSchema = z.object({
    clientUserId: z.string().optional(),
    clientName: z.string().min(1).max(255),
    clientEmail: z.string().email().optional(),
    clientPhone: z.string().max(50).optional(),
    numberOfItems: z.number().int().min(1),
    meetupLocation: z.string().min(1),
    pickupTime: z.string().datetime(),
    sellerMetadata: sellerMetadataSchema.optional(),
    agreedPrice: z.number().positive().optional(),
    agreedPriceCurrency: z.enum(CURRENCIES).default('USD'),
    itemDescription: z.string().optional(),
    links: z.string().optional(),
    imeis: z.string().optional(),
});

// Update request schema (simplified - mainly for editing details or rejecting)
export const updatePickupRequestSchema = z.object({
    clientName: z.string().min(1).max(255).optional(),
    clientEmail: z.string().email().optional(),
    clientPhone: z.string().max(50).optional(),
    numberOfItems: z.number().int().min(1).optional(),
    meetupLocation: z.string().min(1).optional(),
    pickupTime: z.string().datetime().optional(),
    sellerMetadata: sellerMetadataSchema.nullable().optional(),
    agreedPrice: z.number().positive().nullable().optional(),
    itemDescription: z.string().nullable().optional(),
    links: z.string().nullable().optional(),
    imeis: z.string().nullable().optional(),
    status: z.enum(['REJECTED'] as const).optional(), // Only allow setting to REJECTED via update
});
