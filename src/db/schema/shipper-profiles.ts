import { pgTable, serial, text, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';

export const shipperRoleEnum = pgEnum('shipper_role', ['SHIPPER', 'BUSINESS_OWNER']);

export const shipperProfiles = pgTable('shipper_profiles', {
    id: serial('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .unique()
        .references(() => user.id, { onDelete: 'cascade' }),
    role: shipperRoleEnum('role').default('SHIPPER'),
    businessName: varchar('business_name', { length: 255 }),
    logoUrl: varchar('logo_url', { length: 512 }),
    street: varchar('street', { length: 255 }),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    country: varchar('country', { length: 100 }),
    phoneCountryCode: varchar('phone_country_code', { length: 10 }),
    phoneNumber: varchar('phone_number', { length: 20 }),
    requestSlug: varchar('request_slug', { length: 100 }).unique(), // for public pickup request link
    onboardedAt: timestamp('onboarded_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Zod schemas
export const selectShipperProfileSchema = createSelectSchema(shipperProfiles);
export const insertShipperProfileSchema = createInsertSchema(shipperProfiles);
export const patchShipperProfileSchema = insertShipperProfileSchema.partial();
