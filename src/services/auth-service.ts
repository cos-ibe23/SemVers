import { eq } from 'drizzle-orm';
import slugify from 'slugify';
import { shipperProfiles, shipperProfileResponseSchema, type ShipperProfileResponse } from '../db/schema';
import { ApiError, NotFoundError, BadRequestError } from '../lib/errors';
import { Service, type ServiceOptions } from './service';

export interface OnboardProfileInput {
    role: 'SHIPPER' | 'BUSINESS_OWNER';
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

    public async getProfile(): Promise<ShipperProfileResponse | null> {
        try {
            const userId = this.requireUserId();

            const profiles = await this.db
                .select()
                .from(shipperProfiles)
                .where(eq(shipperProfiles.userId, userId))
                .limit(1);

            const profile = profiles[0];
            if (!profile) {
                return null;
            }

            return shipperProfileResponseSchema.parse(profile);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'AuthService.getProfile' });
            throw apiError;
        }
    }

    public async getProfileOrThrow(): Promise<ShipperProfileResponse> {
        try {
            const profile = await this.getProfile();
            if (!profile) {
                throw new NotFoundError('Profile not found - complete onboarding first');
            }
            return profile;
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'AuthService.getProfileOrThrow' });
            throw apiError;
        }
    }

    public async createProfile(input: OnboardProfileInput): Promise<ShipperProfileResponse> {
        try {
            const userId = this.requireUserId();

            const existing = await this.db
                .select({ id: shipperProfiles.id })
                .from(shipperProfiles)
                .where(eq(shipperProfiles.userId, userId))
                .limit(1);

            if (existing.length > 0) {
                throw new BadRequestError('User already onboarded');
            }

            const requestSlug = await this.generateUniqueSlug(input.businessName);

            const [profile] = await this.db
                .insert(shipperProfiles)
                .values({
                    userId,
                    role: input.role,
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
                })
                .returning();

            this.log('profile_created', { profileId: profile.id });

            return shipperProfileResponseSchema.parse(profile);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'AuthService.createProfile' });
            throw apiError;
        }
    }

    public async updateProfile(input: UpdateProfileInput): Promise<ShipperProfileResponse> {
        try {
            const userId = this.requireUserId();

            const existing = await this.db
                .select()
                .from(shipperProfiles)
                .where(eq(shipperProfiles.userId, userId))
                .limit(1);

            if (existing.length === 0) {
                throw new NotFoundError('Profile not found - complete onboarding first');
            }

            const [profile] = await this.db
                .update(shipperProfiles)
                .set({
                    businessName: input.businessName ?? existing[0].businessName,
                    logoUrl: input.logoUrl !== undefined ? input.logoUrl : existing[0].logoUrl,
                    street: input.street !== undefined ? input.street : existing[0].street,
                    city: input.city !== undefined ? input.city : existing[0].city,
                    state: input.state !== undefined ? input.state : existing[0].state,
                    country: input.country !== undefined ? input.country : existing[0].country,
                    phoneCountryCode: input.phoneCountryCode !== undefined ? input.phoneCountryCode : existing[0].phoneCountryCode,
                    phoneNumber: input.phoneNumber !== undefined ? input.phoneNumber : existing[0].phoneNumber,
                })
                .where(eq(shipperProfiles.userId, userId))
                .returning();

            this.log('profile_updated', { profileId: profile.id });

            return shipperProfileResponseSchema.parse(profile);
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
                .select({ id: shipperProfiles.id })
                .from(shipperProfiles)
                .where(eq(shipperProfiles.requestSlug, slug))
                .limit(1);

            if (existing.length === 0) {
                return slug;
            }
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }
}
