import { pgTable, serial, text, integer, varchar, decimal, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { user } from './auth';
import { pickups } from './pickups';
import { currencyEnum } from './fx-rates';
import { timestamps } from './helpers';
import { PICKUP_REQUEST_STATUSES, CURRENCIES, PickupRequestStatus } from '../../constants/enums';

export const pickupRequestStatusEnum = pgEnum('pickup_request_status', PICKUP_REQUEST_STATUSES);

export type SellerMetadata = {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
};

export const pickupRequests = pgTable('pickup_requests', {
    id: serial('id').primaryKey(),
    shipperUserId: text('shipper_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    clientUserId: text('client_user_id').references(() => user.id, { onDelete: 'set null' }),
    clientName: varchar('client_name', { length: 255 }).notNull(),
    clientEmail: varchar('client_email', { length: 255 }),
    clientPhone: varchar('client_phone', { length: 50 }),
    numberOfItems: integer('number_of_items').notNull().default(1),
    meetupLocation: text('meetup_location').notNull(),
    pickupTime: timestamp('pickup_time').notNull(),
    agreedPrice: decimal('agreed_price', { precision: 10, scale: 2 }),
    agreedPriceCurrency: currencyEnum('agreed_price_currency').default('USD'),
    itemDescription: text('item_description'),
    links: text('links').array(),
    sellerMetadata: jsonb('seller_metadata').$type<SellerMetadata>(),
    imeis: text('imeis').array(),
    status: pickupRequestStatusEnum('status').default(PickupRequestStatus.PENDING),
    convertedPickupId: integer('converted_pickup_id').references(() => pickups.id, { onDelete: 'set null' }),
    ...timestamps(),
});

// Zod schemas
export const selectPickupRequestSchema = createSelectSchema(pickupRequests);
export const insertPickupRequestSchema = createInsertSchema(pickupRequests);
export const patchPickupRequestSchema = insertPickupRequestSchema.partial();

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
    links: z.array(z.string()).nullable(),
    sellerMetadata: sellerMetadataSchema.nullable(),
    imeis: z.array(z.string()).nullable(),
    status: z.enum(PICKUP_REQUEST_STATUSES),
    convertedPickupId: z.number().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type PickupRequest = typeof pickupRequests.$inferSelect;
export type PickupRequestResponse = z.infer<typeof pickupRequestResponseSchema>;

export const createPickupRequestPublicSchema = z.object({
    name: z.string().max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(),
    numberOfItems: z.number().int().min(1),
    meetupLocation: z.string().min(1),
    pickupTime: z.string().datetime(),
    sellerMetadata: sellerMetadataSchema.optional(),
    agreedPrice: z.number().positive().optional(),
    itemDescription: z.string().optional(),
    links: z.union([z.string(), z.array(z.string())]).optional(),
    imeis: z.union([z.string(), z.array(z.string())]).optional(),
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
    links: z.union([z.string(), z.array(z.string())]).optional(),
    imeis: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.enum([PickupRequestStatus.REJECTED] as const).optional(),
});
