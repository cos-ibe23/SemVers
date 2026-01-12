import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import {
    user,
    pickupRequests,
    shipperClients,
    fxRates,
    pickupRequestResponseSchema,
    type PickupRequestResponse,
    type SellerMetadata,
} from '../db/schema';
import { ApiError, NotFoundError, BadRequestError } from '../lib/errors';
import { logger } from '../lib/logger';
import { UserRoles } from '../permissions/types';
import { PickupRequestStatus, Currency, type CurrencyType } from '../constants/enums';
import { Service, type ServiceOptions } from './service';

export interface PublicFxRate {
    fromCurrency: CurrencyType;
    toCurrency: CurrencyType;
    rate: string;
}

export interface ShipperPublicInfo {
    id: string;
    name: string;
    businessName: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    fxRates: PublicFxRate[];
}

export interface CreatePublicRequestInput {
    name?: string;
    email?: string;
    phone?: string;
    numberOfItems: number;
    meetupLocation: string;
    pickupTime: string;
    sellerMetadata?: SellerMetadata;
    agreedPrice?: number;
    itemDescription?: string;
    links?: string | string[];
    serialOrImeis?: string | string[];
}

/**
 * PublicRequestService - Handles pickup request submissions (now authenticated).
 */
export class PublicRequestService extends Service {
    constructor(options: ServiceOptions = {}) {
        super(options);
    }

    /**
     * Get shipper info by their request slug.
     * This is used to display the shipper's info on the public request form.
     */
    public async getShipperBySlug(slug: string): Promise<ShipperPublicInfo> {
        try {
            const [shipper] = await db
                .select({
                    id: user.id,
                    name: user.name,
                    businessName: user.businessName,
                    city: user.city,
                    state: user.state,
                    country: user.country,
                    role: user.role,
                    onboardedAt: user.onboardedAt,
                    deletedAt: user.deletedAt,
                })
                .from(user)
                .where(eq(user.requestSlug, slug))
                .limit(1);

            if (!shipper) {
                throw new NotFoundError('Shipper not found');
            }

            if (shipper.deletedAt) {
                throw new NotFoundError('Shipper not found');
            }

            if (shipper.role !== UserRoles.SHIPPER) {
                throw new NotFoundError('Shipper not found');
            }

            if (!shipper.onboardedAt) {
                throw new BadRequestError('This shipper has not completed onboarding');
            }

            const activeFxRates = await db
                .select({
                    fromCurrency: fxRates.fromCurrency,
                    toCurrency: fxRates.toCurrency,
                    clientRate: fxRates.clientRate,
                })
                .from(fxRates)
                .where(
                    and(
                        eq(fxRates.ownerUserId, shipper.id),
                        eq(fxRates.isActive, true)
                    )
                );

            return {
                id: shipper.id,
                name: shipper.name,
                businessName: shipper.businessName,
                city: shipper.city,
                state: shipper.state,
                country: shipper.country,
                fxRates: activeFxRates.map((rate) => ({
                    fromCurrency: rate.fromCurrency as CurrencyType,
                    toCurrency: rate.toCurrency as CurrencyType,
                    rate: rate.clientRate,
                })),
            };
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PublicRequestService.getShipperBySlug' });
            throw apiError;
        }
    }

    public async submitRequest(
        slug: string,
        input: CreatePublicRequestInput
    ): Promise<PickupRequestResponse> {
        try {
            const shipper = await this.getShipperBySlug(slug);
            const client = this.requireUser();

            await this.linkClientToShipper(shipper.id, client.id);

            const [request] = await db
                .insert(pickupRequests)
                .values({
                    shipperUserId: shipper.id,
                    clientUserId: client.id,
                    clientName: client.name,
                    clientEmail: client.email,
                    clientPhone: input.phone || client.phoneNumber || null,
                    numberOfItems: input.numberOfItems,
                    meetupLocation: input.meetupLocation,
                    pickupTime: new Date(input.pickupTime),
                    sellerMetadata: input.sellerMetadata || null,
                    agreedPrice: input.agreedPrice?.toString() || null,
                    agreedPriceCurrency: Currency.USD,
                    itemDescription: input.itemDescription || null,
                    links: Array.isArray(input.links)
                        ? input.links
                        : input.links
                          ? input.links.split(',').map((s) => s.trim())
                          : null,
                    serialOrImeis: Array.isArray(input.serialOrImeis)
                        ? input.serialOrImeis
                        : input.serialOrImeis
                          ? input.serialOrImeis.split(',').map((s) => s.trim())
                          : null,
                    status: PickupRequestStatus.PENDING,
                })
                .returning();

            return pickupRequestResponseSchema.parse(request);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PublicRequestService.submitRequest' });
            throw apiError;
        }
    }

    private async linkClientToShipper(shipperId: string, clientId: string): Promise<void> {
        const [existing] = await db
            .select()
            .from(shipperClients)
            .where(
                and(
                    eq(shipperClients.shipperId, shipperId),
                    eq(shipperClients.clientId, clientId)
                )
            )
            .limit(1);

        if (existing) {
            if (existing.deletedAt) {
                await db
                    .update(shipperClients)
                    .set({ deletedAt: null })
                    .where(
                        and(
                            eq(shipperClients.shipperId, shipperId),
                            eq(shipperClients.clientId, clientId)
                        )
                    );
            }
            return;
        }

        await db.insert(shipperClients).values({
            shipperId,
            clientId,
        });
    }
}
