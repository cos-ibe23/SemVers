import { pgTable, serial, text, integer, varchar, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';
import { pickupRequests } from './pickup-requests';
import { boxes } from './boxes';
import { shipments } from './shipments';

export const notificationTypeEnum = pgEnum('notification_type', [
    'NEW_REQUEST',
    'PAYMENT_SUBMITTED',
    'PAYMENT_VERIFIED',
    'BOX_SHIPPED',
    'BOX_DELIVERED',
]);

// Shipper notifications
export const notifications = pgTable('notifications', {
    id: serial('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message'),
    relatedRequestId: integer('related_request_id')
        .references(() => pickupRequests.id, { onDelete: 'set null' }),
    relatedBoxId: integer('related_box_id')
        .references(() => boxes.id, { onDelete: 'set null' }),
    relatedShipmentId: integer('related_shipment_id')
        .references(() => shipments.id, { onDelete: 'set null' }),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Notification preferences
export const notificationSettings = pgTable('notification_settings', {
    id: serial('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .unique()
        .references(() => user.id, { onDelete: 'cascade' }),
    emailOnNewRequest: boolean('email_on_new_request').default(true),
    emailOnPaymentSubmitted: boolean('email_on_payment_submitted').default(true),
    emailOnPaymentVerified: boolean('email_on_payment_verified').default(true),
    emailOnBoxShipped: boolean('email_on_box_shipped').default(true),
    emailOnBoxDelivered: boolean('email_on_box_delivered').default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Email logs for debugging
export const emailLogs = pgTable('email_logs', {
    id: serial('id').primaryKey(),
    toEmail: varchar('to_email', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 500 }).notNull(),
    templateName: varchar('template_name', { length: 100 }), // 'quote_sent', 'payment_verified', etc.
    relatedUserId: text('related_user_id')
        .references(() => user.id, { onDelete: 'set null' }),
    relatedRequestId: integer('related_request_id')
        .references(() => pickupRequests.id, { onDelete: 'set null' }),
    relatedBoxId: integer('related_box_id')
        .references(() => boxes.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 20 }).default('PENDING'), // PENDING, SENT, FAILED
    errorMessage: text('error_message'),
    sentAt: timestamp('sent_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Zod schemas
export const selectNotificationSchema = createSelectSchema(notifications);
export const insertNotificationSchema = createInsertSchema(notifications);

export const selectNotificationSettingsSchema = createSelectSchema(notificationSettings);
export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings);
export const patchNotificationSettingsSchema = insertNotificationSettingsSchema.partial();

export const selectEmailLogSchema = createSelectSchema(emailLogs);
export const insertEmailLogSchema = createInsertSchema(emailLogs);
