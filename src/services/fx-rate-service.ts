import { eq, and, desc } from 'drizzle-orm';
import {
    fxRates,
    fxRateResponseSchema,
    type FxRateResponse,
} from '../db/schema';
import { ApiError, ForbiddenError, NotFoundError, BadRequestError } from '../lib/errors';
import { Resources } from '../lib/user-can';
import { Service, type ServiceOptions } from './service';

export interface CreateFxRateInput {
    fromCurrency: 'USD' | 'NGN' | 'GBP' | 'EUR';
    toCurrency: 'USD' | 'NGN' | 'GBP' | 'EUR';
    rate: string;
}

export interface UpdateFxRateInput {
    rate?: string;
    isActive?: boolean;
}

export interface ListFxRatesOptions {
    fromCurrency?: 'USD' | 'NGN' | 'GBP' | 'EUR';
    toCurrency?: 'USD' | 'NGN' | 'GBP' | 'EUR';
    activeOnly?: boolean;
}

export class FxRateService extends Service {
    constructor(options: ServiceOptions = {}) {
        super(options);
    }

    /**
     * Create a new FX rate for the shipper.
     * If a rate for this currency pair exists and is active, it will be deactivated.
     */
    public async create(input: CreateFxRateInput): Promise<FxRateResponse> {
        try {
            const ownerUserId = this.requireUserId();

            if (!this.userCan.canCreate(Resources.FX_RATES)) {
                throw new ForbiddenError('You are not authorized to create FX rates');
            }

            // Validate that from and to currencies are different
            if (input.fromCurrency === input.toCurrency) {
                throw new BadRequestError('From and To currencies must be different');
            }

            // Deactivate existing active rate for this currency pair
            await this.db
                .update(fxRates)
                .set({ isActive: false })
                .where(
                    and(
                        eq(fxRates.ownerUserId, ownerUserId),
                        eq(fxRates.fromCurrency, input.fromCurrency),
                        eq(fxRates.toCurrency, input.toCurrency),
                        eq(fxRates.isActive, true)
                    )
                );

            // Create new rate
            const [newRate] = await this.db
                .insert(fxRates)
                .values({
                    ownerUserId,
                    fromCurrency: input.fromCurrency,
                    toCurrency: input.toCurrency,
                    rate: input.rate,
                    isActive: true,
                })
                .returning();

            this.log('fx_rate_create', {
                rateId: newRate.id,
                fromCurrency: input.fromCurrency,
                toCurrency: input.toCurrency,
                rate: input.rate,
            });

            return fxRateResponseSchema.parse(newRate);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'FxRateService.create' });
            throw apiError;
        }
    }

    /**
     * Get a specific FX rate by ID.
     */
    public async getById(id: number): Promise<FxRateResponse> {
        try {
            const ownerUserId = this.requireUserId();

            const [rate] = await this.db
                .select()
                .from(fxRates)
                .where(
                    and(
                        eq(fxRates.id, id),
                        eq(fxRates.ownerUserId, ownerUserId)
                    )
                )
                .limit(1);

            if (!rate) {
                throw new NotFoundError('FX rate not found');
            }

            if (!this.userCan.canRead(Resources.FX_RATES, { ownerUserId: rate.ownerUserId })) {
                throw new ForbiddenError('You are not authorized to view this FX rate');
            }

            return fxRateResponseSchema.parse(rate);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'FxRateService.getById' });
            throw apiError;
        }
    }

    /**
     * Get the current active FX rate for a currency pair.
     */
    public async getCurrentRate(
        fromCurrency: 'USD' | 'NGN' | 'GBP' | 'EUR' = 'USD',
        toCurrency: 'USD' | 'NGN' | 'GBP' | 'EUR' = 'NGN'
    ): Promise<FxRateResponse | null> {
        try {
            const ownerUserId = this.requireUserId();

            if (!this.userCan.canRead(Resources.FX_RATES)) {
                throw new ForbiddenError('You are not authorized to view FX rates');
            }

            const [rate] = await this.db
                .select()
                .from(fxRates)
                .where(
                    and(
                        eq(fxRates.ownerUserId, ownerUserId),
                        eq(fxRates.fromCurrency, fromCurrency),
                        eq(fxRates.toCurrency, toCurrency),
                        eq(fxRates.isActive, true)
                    )
                )
                .limit(1);

            if (!rate) {
                return null;
            }

            return fxRateResponseSchema.parse(rate);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'FxRateService.getCurrentRate' });
            throw apiError;
        }
    }

    /**
     * List all FX rates for the shipper.
     */
    public async list(options: ListFxRatesOptions = {}): Promise<FxRateResponse[]> {
        try {
            const ownerUserId = this.requireUserId();

            if (!this.userCan.canList(Resources.FX_RATES)) {
                throw new ForbiddenError('You are not authorized to list FX rates');
            }

            const conditions = [eq(fxRates.ownerUserId, ownerUserId)];

            if (options.fromCurrency) {
                conditions.push(eq(fxRates.fromCurrency, options.fromCurrency));
            }

            if (options.toCurrency) {
                conditions.push(eq(fxRates.toCurrency, options.toCurrency));
            }

            if (options.activeOnly) {
                conditions.push(eq(fxRates.isActive, true));
            }

            const rates = await this.db
                .select()
                .from(fxRates)
                .where(and(...conditions))
                .orderBy(desc(fxRates.createdAt));

            return rates.map((rate) => fxRateResponseSchema.parse(rate));
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'FxRateService.list' });
            throw apiError;
        }
    }

    /**
     * Update an FX rate.
     */
    public async update(id: number, input: UpdateFxRateInput): Promise<FxRateResponse> {
        try {
            const ownerUserId = this.requireUserId();

            // First get the rate to check ownership
            const [existingRate] = await this.db
                .select()
                .from(fxRates)
                .where(
                    and(
                        eq(fxRates.id, id),
                        eq(fxRates.ownerUserId, ownerUserId)
                    )
                )
                .limit(1);

            if (!existingRate) {
                throw new NotFoundError('FX rate not found');
            }

            if (!this.userCan.canUpdate(Resources.FX_RATES, { ownerUserId: existingRate.ownerUserId })) {
                throw new ForbiddenError('You are not authorized to update this FX rate');
            }

            // If activating this rate, deactivate others for the same currency pair
            if (input.isActive === true) {
                await this.db
                    .update(fxRates)
                    .set({ isActive: false })
                    .where(
                        and(
                            eq(fxRates.ownerUserId, ownerUserId),
                            eq(fxRates.fromCurrency, existingRate.fromCurrency),
                            eq(fxRates.toCurrency, existingRate.toCurrency),
                            eq(fxRates.isActive, true)
                        )
                    );
            }

            const [updatedRate] = await this.db
                .update(fxRates)
                .set({
                    rate: input.rate ?? existingRate.rate,
                    isActive: input.isActive ?? existingRate.isActive,
                })
                .where(eq(fxRates.id, id))
                .returning();

            this.log('fx_rate_update', { rateId: id, updates: Object.keys(input) });

            return fxRateResponseSchema.parse(updatedRate);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'FxRateService.update' });
            throw apiError;
        }
    }

    /**
     * Delete an FX rate.
     */
    public async delete(id: number): Promise<void> {
        try {
            const ownerUserId = this.requireUserId();

            const [existingRate] = await this.db
                .select()
                .from(fxRates)
                .where(
                    and(
                        eq(fxRates.id, id),
                        eq(fxRates.ownerUserId, ownerUserId)
                    )
                )
                .limit(1);

            if (!existingRate) {
                throw new NotFoundError('FX rate not found');
            }

            if (!this.userCan.canDelete(Resources.FX_RATES, { ownerUserId: existingRate.ownerUserId })) {
                throw new ForbiddenError('You are not authorized to delete this FX rate');
            }

            await this.db.delete(fxRates).where(eq(fxRates.id, id));

            this.log('fx_rate_delete', { rateId: id });
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'FxRateService.delete' });
            throw apiError;
        }
    }
}
