import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer, customSession } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { env } from '../env';
import * as HttpStatusCodes from '../lib/http-status-codes';
import * as HttpStatusPhrases from '../lib/http-status-phrases';
import { ApiError } from '../lib/errors';
import { logger } from '../lib/logger';
import { UserRoles } from '../permissions/types';
import { user } from './schema/auth';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
    }),

    appName: 'imbod',
    baseURL: env.BETTER_AUTH_URL || 'http://localhost:4000',
    basePath: '/v1/auth',
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins:
        env.NODE_ENV === 'production'
            ? [
                  // Production domains - add your actual domains
                  // Parse comma-separated origins from environment variable
                  ...(env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) || []),
              ]
            : [
                  // Development origins
                  'http://localhost:4000',
                  'http://localhost:3000',
                  'http://127.0.0.1:4000',
                  'http://127.0.0.1:3000',
              ],
    advanced: {
        // Custom cookie configuration
        cookies: {
            session_token: {
                name: 'imbod_session',
                attributes: {
                    httpOnly: true,
                    secure: env.NODE_ENV === 'production',
                    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
                    path: '/',
                },
            },
        },
        cookiePrefix: 'imbod_',
    },

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
            allowDifferentEmails: false,
        },
    },

    // Custom user fields
    // Note: Default role is SHIPPER for MVP (shipper-focused).
    // Clients are created by shippers, admins are assigned internally.
    user: {
        additionalFields: {
            role: {
                type: 'string',
                defaultValue: UserRoles.SHIPPER,
                input: false, // Cannot be set by user during signup
                returned: true,
            },
            isSystemUser: {
                type: 'boolean',
                defaultValue: false,
                input: false, // Cannot be set by user during signup
                returned: true,
            },
            // Business/onboarding fields - returned in sign-in response for frontend context
            onboardedAt: {
                type: 'date',
                input: false,
                returned: true,
            },
            businessName: {
                type: 'string',
                input: false,
                returned: true,
            },
            requestSlug: {
                type: 'string',
                input: false,
                returned: true,
            },
            // Onboarding fields
            street: { type: 'string', input: false, returned: true },
            city: { type: 'string', input: false, returned: true },
            state: { type: 'string', input: false, returned: true },
            country: { type: 'string', input: false, returned: true },
            phone: { type: 'string', input: false, returned: true },
            // Vouching status
            // UNVERIFIED -> PENDING_VOUCH -> VERIFIED (or REJECTED)
            verificationStatus: { 
                type: 'string', 
                defaultValue: 'UNVERIFIED',
                input: false,
                returned: true 
            },
        },
    },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: false, // Disabled for security - don't expose user data in cookies
        },
    },
    plugins: [
        // Enable Bearer token authentication for API clients (Bruno, mobile apps, etc.)
        // After sign-in, token is returned in 'set-auth-token' response header
        bearer(),
        customSession(async ({ user: userFromSession, session }) => {
            // Better-auth already provides all user fields including custom fields
            // in the userFromSession object. No need for an additional DB query.
            // This optimization eliminates 100-500ms of latency per sign-in.
            
            // Prevent system users from creating sessions (security measure)
            // System users should only be used for background jobs, not interactive sessions
            if (userFromSession.isSystemUser) {
                logger.error(
                    { userId: userFromSession.id },
                    'An attempt was made to create a session for a system user. This is not allowed.'
                );
                throw new ApiError('An error has occurred. Please contact support.', {
                    statusCode: HttpStatusCodes.FORBIDDEN,
                    statusPhrase: HttpStatusPhrases.FORBIDDEN,
                });
            }

            // Return user with all fields already available from better-auth
            return {
                user: userFromSession,
                session,
            };
        }),
    ],
});

// Type exports for use in handlers
export type Session = typeof auth.$Infer.Session.session;

// Better Auth session user type (for session handling)
export type SessionUser = typeof auth.$Infer.Session.user;

// Full User type from database schema (includes role, isSystemUser, and all other fields)
// This is the type that should be used in UserCan and throughout the application
export type User = typeof user.$inferSelect;
