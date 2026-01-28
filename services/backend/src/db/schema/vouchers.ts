import { pgTable, serial, text, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { timestamps } from './helpers';

// Vouch status enum
export const vouchStatusEnum = pgEnum('vouch_status', ['PENDING', 'APPROVED', 'DECLINED']);

export const userVouches = pgTable('user_vouches', {
    id: serial('id').primaryKey(),
    
    // The new user requesting access
    requesterUserId: text('requester_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
        
    // The email they claimed knows them
    voucherEmail: varchar('voucher_email', { length: 255 }).notNull(),
    
    // If that email matches an existing user, link it here
    voucherUserId: text('voucher_user_id')
        .references(() => user.id, { onDelete: 'set null' }),
        
    status: vouchStatusEnum('status').default('PENDING'),
    
    // Token for one-click approval via email (optional security measure)
    token: varchar('token', { length: 128 }),
    
    ...timestamps(),
});
