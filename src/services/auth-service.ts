import { eq } from 'drizzle-orm';
import slugify from 'slugify';
import { user, userResponseSchema, type UserResponse } from '../db/schema';
import { ApiError, NotFoundError, BadRequestError } from '../lib/errors';
import { UserRoles } from '../permissions/types';
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
     * Get the current user with all profile/business fields
     */
    public async getUser(): Promise<UserResponse | null> {
        try {
            const userId = this.requireUserId();

            const users = await this.db
                .select()
                .from(user)
                .where(eq(user.id, userId))
                .limit(1);

            const foundUser = users[0];
            if (!foundUser) {
                return null;
            }

            return userResponseSchema.parse(foundUser);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'AuthService.getUser' });
            throw apiError;
        }
    }

    /**
     * Get the current user or throw if not found
     */
    public async getUserOrThrow(): Promise<UserResponse> {
        try {
            const foundUser = await this.getUser();
            if (!foundUser) {
                throw new NotFoundError('User not found');
            }
            return foundUser;
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'AuthService.getUserOrThrow' });
            throw apiError;
        }
    }

    /**
     * Check if shipper has completed onboarding
     */
    public async isOnboarded(): Promise<boolean> {
        const foundUser = await this.getUser();
        return foundUser?.onboardedAt !== null;
    }

    /**
     * Complete shipper onboarding by setting business fields
     * Only shippers can onboard (get requestSlug)
     */
    public async onboard(input: OnboardInput): Promise<UserResponse> {
        try {
            const userId = this.requireUserId();

            // Check if user is a shipper
            const existingUsers = await this.db
                .select()
                .from(user)
                .where(eq(user.id, userId))
                .limit(1);

            const existingUser = existingUsers[0];
            if (!existingUser) {
                throw new NotFoundError('User not found');
            }

            if (existingUser.role !== UserRoles.SHIPPER) {
                throw new BadRequestError('Only shippers can complete onboarding');
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

            const existingUsers = await this.db
                .select()
                .from(user)
                .where(eq(user.id, userId))
                .limit(1);

            const existingUser = existingUsers[0];
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
