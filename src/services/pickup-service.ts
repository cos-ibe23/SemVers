import { eq, and, desc, count, sql, getTableColumns, inArray } from 'drizzle-orm';
import {
    pickups,
    pickupRequests,
    fxRates,
    selectPickupSchema,
    pickupResponseSchema,
    items,
    createItemRequestSchema,
    type PickupResponse,
} from '../db/schema';
import { ApiError, ForbiddenError, NotFoundError, BadRequestError } from '../lib/errors';
import { Resources } from '../lib/user-can';
import { Service, type ServiceOptions } from './service';
import { PickupStatus, PickupRequestStatus } from '../constants/enums';

export interface CreatePickupInput {
    clientUserId?: string;
    pickupFeeUsd?: number;
    itemPriceUsd?: number;
    notes?: string;
    pickupDate?: string;
    fxRateId?: number;
    sourceRequestId?: number;
    items?: Array<{
        category: string;
        model?: string;
        imei?: string;
        estimatedWeightLb?: number;
        clientShippingUsd?: number;
    }>;
}

export interface UpdatePickupInput {
    pickupFeeUsd?: number;
    itemPriceUsd?: number;
    notes?: string | null;
    pickupDate?: string | null;
    status?: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
    fxRateId?: number | null;
    items?: Array<{
        id?: number;
        category: string;
        model?: string;
        imei?: string;
        estimatedWeightLb?: number;
        clientShippingUsd?: number;
    }>;
}

export interface ListPickupsOptions {
    page?: number;
    limit?: number;
    status?: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
    clientId?: string;
}

export interface PaginatedPickups {
    data: PickupResponse[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export class PickupService extends Service {
    constructor(options: ServiceOptions = {}) {
        super(options);
    }

    /**
     * Create a new pickup.
     */
    public async create(input: CreatePickupInput): Promise<PickupResponse> {
        try {
            const ownerUserId = this.requireUserId();
            let sourceRequest: typeof pickupRequests.$inferSelect | null = null;

            if (!this.userCan.canCreate(Resources.PICKUPS)) {
                throw new ForbiddenError('You are not authorized to create pickups');
            }

            // Check source request if provided
            if (input.sourceRequestId) {
                const [request] = await this.db
                    .select()
                    .from(pickupRequests)
                    .where(eq(pickupRequests.id, input.sourceRequestId))
                    .limit(1);

                if (!request) {
                    throw new BadRequestError('Source pickup request not found');
                }

                if (request.shipperUserId !== ownerUserId) {
                    throw new ForbiddenError('You do not own this pickup request');
                }

                if (request.status === PickupRequestStatus.CONVERTED) {
                    throw new BadRequestError('This pickup request has already been converted');
                }

                sourceRequest = request;
            }

            // Validate FX rate if provided
            if (input.fxRateId) {
                const [fxRate] = await this.db
                    .select()
                    .from(fxRates)
                    .where(
                        and(
                            eq(fxRates.id, input.fxRateId),
                            eq(fxRates.ownerUserId, ownerUserId)
                        )
                    )
                    .limit(1);

                if (!fxRate) {
                    throw new BadRequestError('Invalid FX rate');
                }
            }

            // Use defaults from source request if available and not overridden
            const clientUserId = input.clientUserId || sourceRequest?.clientUserId || null;

            // Default prices from request if not provided
            const itemPriceUsd = input.itemPriceUsd !== undefined 
                ? input.itemPriceUsd.toString() 
                : sourceRequest?.agreedPrice || '0';

            const result = await this.db.transaction(async (tx) => {
                const [pickup] = await tx
                    .insert(pickups)
                    .values({
                        ownerUserId,
                        clientUserId: clientUserId,
                        pickupFeeUsd: input.pickupFeeUsd?.toString() || '0',
                        itemPriceUsd: itemPriceUsd,
                        notes: input.notes || null,
                        pickupDate: input.pickupDate || sourceRequest?.pickupTime.toISOString().split('T')[0] || null,
                        fxRateId: input.fxRateId || null,
                        sourceRequestId: input.sourceRequestId || null,
                        status: PickupStatus.DRAFT,
                    })
                    .returning();

                // Insert items if provided
                if (input.items && input.items.length > 0) {
                    const itemsToInsert = input.items.map(item => ({
                        pickupId: pickup.id,
                        category: item.category,
                        model: item.model || null,
                        imei: item.imei || null,
                        estimatedWeightLb: item.estimatedWeightLb?.toString() || '0',
                        clientShippingUsd: item.clientShippingUsd?.toString() || '0',
                    }));
                    
                    await tx.insert(items).values(itemsToInsert);
                }

                // If created from request, update request status
                if (input.sourceRequestId) {
                    await tx
                        .update(pickupRequests)
                        .set({
                            status: PickupRequestStatus.CONVERTED,
                            convertedPickupId: pickup.id,
                            updatedAt: new Date(),
                        })
                        .where(eq(pickupRequests.id, input.sourceRequestId));
                }

                return pickup;
            });

            this.log('pickup_create', { pickupId: result.id, clientUserId: clientUserId, sourceRequestId: input.sourceRequestId });

            return this.getById(result.id);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PickupService.create' });
            throw apiError;
        }
    }

    /**
     * Get a pickup by ID.
     */
    public async getById(id: number): Promise<PickupResponse> {
        try {
            const ownerUserId = this.requireUserId();

            const [pickup] = await this.db
                .select()
                .from(pickups)
                .where(eq(pickups.id, id))
                .limit(1);

            if (!pickup) {
                throw new NotFoundError('Pickup not found');
            }

            // Check ownership
            if (!this.userCan.isAdmin() && pickup.ownerUserId !== ownerUserId) {
                throw new ForbiddenError('You are not authorized to view this pickup');
            }

            // Fetch items
            const pickupItems = await this.db
                .select()
                .from(items)
                .where(eq(items.pickupId, id));

            // Calculate total
            const itemsShippingTotal = pickupItems.reduce((sum, item) => sum + Number(item.clientShippingUsd), 0);
            const itemsWeightTotal = pickupItems.reduce((sum, item) => sum + Number(item.estimatedWeightLb), 0);
            const total = Number(pickup.pickupFeeUsd) + Number(pickup.itemPriceUsd) + itemsShippingTotal;

            return pickupResponseSchema.parse({
                ...pickup,
                items: pickupItems.map(item => ({
                    ...item,
                    estimatedWeightLb: item.estimatedWeightLb?.toString() || null,
                    clientShippingUsd: item.clientShippingUsd?.toString() || null
                })),
                totalPriceUsd: total.toFixed(2),
                totalWeightLb: itemsWeightTotal.toFixed(2),
            });
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PickupService.getById' });
            throw apiError;
        }
    }

    /**
     * List pickups for the shipper.
     */
    /**
     * List pickups for the shipper.
     */
    public async list(options: ListPickupsOptions = {}): Promise<PaginatedPickups> {
        try {
            const ownerUserId = this.requireUserId();
            const { page = 1, limit = 20, status, clientId } = options;
            const offset = (page - 1) * limit;

            if (!this.userCan.canList(Resources.PICKUPS)) {
                throw new ForbiddenError('You are not authorized to list pickups');
            }

            // Base conditions
            const conditions = this.userCan.isAdmin()
                ? []
                : [eq(pickups.ownerUserId, ownerUserId)];

            // Status filter
            if (status) {
                conditions.push(eq(pickups.status, status));
            }

            // Client filter
            if (clientId) {
                conditions.push(eq(pickups.clientUserId, clientId));
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // Get total count
            const [{ total }] = await this.db
                .select({ total: count() })
                .from(pickups)
                .where(whereClause);

            // Get paginated results (just pickups first)
            const pickupResults = await this.db
                .select()
                .from(pickups)
                .where(whereClause)
                .orderBy(desc(pickups.createdAt))
                .limit(limit)
                .offset(offset);

            // Fetch items for these pickups
            const pickupIds = pickupResults.map(p => p.id);
            const itemsMap = new Map<number, typeof items.$inferSelect[]>();

            if (pickupIds.length > 0) {
                const allItems = await this.db
                    .select()
                    .from(items)
                    .where(inArray(items.pickupId, pickupIds));

                // Verify if IN clause syntax is correct for Drizzle with arrays, otherwise use iteration or 'inArray' helper if available
                // Drizzle 'inArray' is preferred: import { inArray } from 'drizzle-orm';
                // I need to import inArray from drizzle-orm. For now, assuming I'll fix imports.
                
                allItems.forEach(item => {
                    const existing = itemsMap.get(item.pickupId) || [];
                    existing.push(item);
                    itemsMap.set(item.pickupId, existing);
                });
            }

            return {
                data: pickupResults.map((r) => {
                    const rItems = itemsMap.get(r.id) || [];
                    const itemsShipping = rItems.reduce((sum, i) => sum + Number(i.clientShippingUsd), 0);
                    const itemsWeight = rItems.reduce((sum, i) => sum + Number(i.estimatedWeightLb), 0);
                    const total = Number(r.pickupFeeUsd) + Number(r.itemPriceUsd) + itemsShipping;
                    
                    return pickupResponseSchema.parse({
                        ...r,
                        items: rItems.map(item => ({
                            ...item,
                            estimatedWeightLb: item.estimatedWeightLb?.toString() || null,
                            clientShippingUsd: item.clientShippingUsd?.toString() || null
                        })),
                        totalPriceUsd: total.toFixed(2),
                        totalWeightLb: itemsWeight.toFixed(2),
                    });
                }),
                total,
                page,
                limit,
                hasMore: offset + pickupResults.length < total,
            };
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PickupService.list' });
            throw apiError;
        }
    }

    /**
     * Update a pickup.
     */
    public async update(id: number, input: UpdatePickupInput): Promise<PickupResponse> {
        try {
            const ownerUserId = this.requireUserId();

            // Get existing pickup
            const existing = await this.getById(id);

            if (!this.userCan.canUpdate(Resources.PICKUPS, { ownerUserId: existing.ownerUserId })) {
                throw new ForbiddenError('You are not authorized to update this pickup');
            }

            // Validate FX rate if provided
            if (input.fxRateId) {
                const [fxRate] = await this.db
                    .select()
                    .from(fxRates)
                    .where(
                        and(
                            eq(fxRates.id, input.fxRateId),
                            eq(fxRates.ownerUserId, ownerUserId)
                        )
                    )
                    .limit(1);

                if (!fxRate) {
                    throw new BadRequestError('Invalid FX rate');
                }
            }

            await this.db.transaction(async (tx) => {
                const updateData: Record<string, unknown> = {};

                if (input.pickupFeeUsd !== undefined) updateData.pickupFeeUsd = input.pickupFeeUsd.toString();
                if (input.itemPriceUsd !== undefined) updateData.itemPriceUsd = input.itemPriceUsd.toString();
                if (input.notes !== undefined) updateData.notes = input.notes;
                if (input.pickupDate !== undefined) updateData.pickupDate = input.pickupDate;
                if (input.status !== undefined) updateData.status = input.status;
                if (input.fxRateId !== undefined) updateData.fxRateId = input.fxRateId;

                if (Object.keys(updateData).length > 0) {
                    await tx
                    .update(pickups)
                    .set(updateData)
                    .where(eq(pickups.id, id));
                }

                // Handle items upsert
                if (input.items) {
                    for (const item of input.items) {
                        const itemData = {
                            pickupId: id,
                            category: item.category,
                            model: item.model || null,
                            imei: item.imei || null,
                            estimatedWeightLb: item.estimatedWeightLb?.toString() || '0',
                            clientShippingUsd: item.clientShippingUsd?.toString() || '0',
                        };

                        if (item.id) {
                            // Update existing
                            await tx
                                .update(items)
                                .set(itemData)
                                .where(and(eq(items.id, item.id), eq(items.pickupId, id)));
                        } else {
                            // Insert new
                            await tx.insert(items).values(itemData);
                        }
                    }
                }
            });

            this.log('pickup_update', { pickupId: id, updates: Object.keys(input) });

            return this.getById(id);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PickupService.update' });
            throw apiError;
        }
    }

    /**
     * Delete a pickup.
     */
    public async delete(id: number): Promise<void> {
        try {
            const existing = await this.getById(id);

            if (!this.userCan.canDelete(Resources.PICKUPS, { ownerUserId: existing.ownerUserId })) {
                throw new ForbiddenError('You are not authorized to delete this pickup');
            }

            // Only allow deletion of draft pickups
            if (existing.status !== PickupStatus.DRAFT) {
                throw new BadRequestError('Only draft pickups can be deleted');
            }

            await this.db.delete(pickups).where(eq(pickups.id, id));

            this.log('pickup_delete', { pickupId: id });
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PickupService.delete' });
            throw apiError;
        }
    }
}
