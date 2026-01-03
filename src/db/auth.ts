import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { customSession } from 'better-auth/plugins';
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
            },
            isSystemUser: {
                type: 'boolean',
                defaultValue: false,
                input: false, // Cannot be set by user during signup
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
        customSession(async ({ user: userFromSession, session }) => {
            // Fetch full user from database to get isSystemUser flag
            const [u] = await db
                .select()
                .from(user)
                .where(eq(user.id, userFromSession.id))
                .limit(1);

            if (!u) {
                // Fallback to original user if not found in database
                return {
                    user: userFromSession,
                    session,
                };
            }

            // Prevent system users from creating sessions (security measure)
            // System users should only be used for background jobs, not interactive sessions
            if (u.isSystemUser) {
                logger.error(
                    { userId: u.id },
                    'An attempt was made to create a session for a system user. This is not allowed.'
                );
                throw new ApiError('An error has occurred. Please contact support.', {
                    statusCode: HttpStatusCodes.FORBIDDEN,
                    statusPhrase: HttpStatusPhrases.FORBIDDEN,
                });
            }

            // Return user with isSystemUser flag for permission checks
            return {
                user: {
                    ...userFromSession,
                    isSystemUser: u.isSystemUser,
                },
                session,
            };
        }),
    ],
});

// Type exports for use in handlers
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
