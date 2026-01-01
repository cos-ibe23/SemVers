import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './index';
import { env } from '../env';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
    }),

    appName: 'imbod',
    baseURL: env.BETTER_AUTH_URL,
    basePath: '/v1/auth',
    secret: env.BETTER_AUTH_SECRET,

    // Email + Password authentication
    emailAndPassword: {
        enabled: true,
        // sendResetPassword: async ({ user, url }) => {
        //     // TODO: Send password reset email via Resend
        // },
        // sendVerificationEmail: async ({ user, url }) => {
        //     // TODO: Send email verification
        // },
    },

    // Google OAuth
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },

    // Account linking - allow users to link multiple auth methods
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ['google', 'credential'],
        },
    },

    // Custom user fields
    user: {
        additionalFields: {
            role: {
                type: 'string',
                defaultValue: 'SHIPPER',
                input: false, // Cannot be set by user during signup
            },
        },
    },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minutes
        },
    },
});

// Type exports for use in handlers
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
