import { eq } from 'drizzle-orm';
import slugify from 'slugify';
import { db } from '../db';
import { user, userResponseSchema, type UserResponse } from '../db/schema';
import { ApiError, NotFoundError, BadRequestError } from '../lib/errors';
import { logger } from '../lib/logger';
import { Resources } from '../permissions/types';
import { Service, type ServiceOptions } from './service';

export interface OnboardInput {
    businessName: string;
    logoUrl?: string | null;
    street?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    phoneCountryCode?: string | null;
    phoneNumber?: string | null;
}

export interface UpdateProfileInput {
    businessName?: string;
    logoUrl?: string | null;
    street?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    phoneCountryCode?: string | null;
    phoneNumber?: string | null;
}

export class AuthService extends Service {
    constructor(options: ServiceOptions = {}) {
        super(options);
    }

    /**
     * Get the system user from the database.
     * This is a static method that can be called without user context.
     * Used for background jobs, migrations, etc.
     *
     * Throws NotFoundError if system user doesn't exist - the system user
     * should always be present in the database (created during seeding).
     */
    public static async getSystemUser(): Promise<UserResponse> {
        try {
            const [systemUser] = await db
                .select()
                .from(user)
                .where(eq(user.isSystemUser, true))
                .limit(1);

            if (!systemUser) {
                logger.error('System user not found in database. Please run database seeding.');
                throw new NotFoundError('System user not found. Run database seeding first.');
            }

            return userResponseSchema.parse(systemUser);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'AuthService.getSystemUser' });
            throw apiError;
        }
    }

    /**
     * Get the current authenticated user with all profile/business fields.
     * Throws NotFoundError if user doesn't exist.
     */
    public async getUser(): Promise<UserResponse> {
        try {
            const userId = this.requireUserId();

            const [foundUser] = await this.db
                .select()
                .from(user)
                .where(eq(user.id, userId))
                .limit(1);

            if (!foundUser) {
                throw new NotFoundError('User not found');
            }

            return userResponseSchema.parse(foundUser);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'AuthService.getUser' });
            throw apiError;
        }
    }

    /**
     * Complete shipper onboarding by setting business fields
     * Only shippers can onboard (get requestSlug)
     * Uses UserCan RBAC to check permissions
     */
    public async onboard(input: OnboardInput): Promise<UserResponse> {
        try {
            const userId = this.requireUserId();

            // Check permissions using UserCan RBAC
            if (!this.userCan.canCreate(Resources.PROFILES)) {
                throw new BadRequestError('You do not have permission to complete onboarding');
            }

            // Only shippers can onboard (get requestSlug)
            if (!this.userCan.isShipper()) {
                throw new BadRequestError('Only shippers can complete onboarding');
            }

            const [existingUser] = await this.db
                .select()
                .from(user)
                .where(eq(user.id, userId))
                .limit(1);

            if (!existingUser) {
                throw new NotFoundError('User not found');
            }

            if (existingUser.onboardedAt) {
                throw new BadRequestError('User already onboarded');
            }

            const requestSlug = await this.generateUniqueSlug(input.businessName);

            const [updatedUser] = await this.db
                .update(user)
                .set({
                    businessName: input.businessName,
                    logoUrl: input.logoUrl ?? null,
                    street: input.street ?? null,
                    city: input.city ?? null,
                    state: input.state ?? null,
                    country: input.country ?? null,
                    phoneCountryCode: input.phoneCountryCode ?? null,
                    phoneNumber: input.phoneNumber ?? null,
                    requestSlug,
                    onboardedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(user.id, userId))
                .returning();

            this.log('shipper_onboarded', { userId: updatedUser.id });

            return userResponseSchema.parse(updatedUser);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'AuthService.onboard' });
            throw apiError;
        }
    }

    /**
     * Update user profile/business fields
     */
    public async updateProfile(input: UpdateProfileInput): Promise<UserResponse> {
        try {
            const userId = this.requireUserId();

            const [existingUser] = await this.db
                .select()
                .from(user)
                .where(eq(user.id, userId))
                .limit(1);

            if (!existingUser) {
                throw new NotFoundError('User not found');
            }

            const [updatedUser] = await this.db
                .update(user)
                .set({
                    businessName: input.businessName ?? existingUser.businessName,
                    logoUrl: input.logoUrl !== undefined ? input.logoUrl : existingUser.logoUrl,
                    street: input.street !== undefined ? input.street : existingUser.street,
                    city: input.city !== undefined ? input.city : existingUser.city,
                    state: input.state !== undefined ? input.state : existingUser.state,
                    country: input.country !== undefined ? input.country : existingUser.country,
                    phoneCountryCode: input.phoneCountryCode !== undefined ? input.phoneCountryCode : existingUser.phoneCountryCode,
                    phoneNumber: input.phoneNumber !== undefined ? input.phoneNumber : existingUser.phoneNumber,
                    updatedAt: new Date(),
                })
                .where(eq(user.id, userId))
                .returning();

            this.log('profile_updated', { userId: updatedUser.id });

            return userResponseSchema.parse(updatedUser);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'AuthService.updateProfile' });
            throw apiError;
        }
    }

    private async generateUniqueSlug(businessName: string): Promise<string> {
        const baseSlug = slugify(businessName, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;

        while (true) {
            const existing = await this.db
                .select({ id: user.id })
                .from(user)
                .where(eq(user.requestSlug, slug))
                .limit(1);

            if (existing.length === 0) {
                return slug;
            }
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }
}
