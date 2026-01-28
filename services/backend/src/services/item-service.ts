import { eq, and, desc } from 'drizzle-orm';
import {
    items,
    pickups,
    itemResponseSchema,
    type ItemResponse,
} from '../db/schema';
import { ApiError, ForbiddenError, NotFoundError } from '../lib/errors';
import { Resources } from '../lib/user-can';
import { Service, type ServiceOptions } from './service';

export interface CreateItemInput {
    category: string;
    model?: string;
    serialOrImei?: string;
    estimatedWeightLb?: number;
    clientShippingUsd?: number;
}

export interface UpdateItemInput {
    category?: string;
    model?: string | null;
    serialOrImei?: string | null;
    estimatedWeightLb?: number;
    clientShippingUsd?: number;
}

export class ItemService extends Service {
    constructor(options: ServiceOptions = {}) {
        super(options);
    }

    /**
     * Add an item to a pickup.
     */
    public async addToPickup(pickupId: number, input: CreateItemInput): Promise<ItemResponse> {
        try {
            const ownerUserId = this.requireUserId();

            if (!this.userCan.canCreate(Resources.ITEMS)) {
                throw new ForbiddenError('You are not authorized to add items');
            }

            // Verify pickup exists and belongs to user
            const [pickup] = await this.db
                .select()
                .from(pickups)
                .where(eq(pickups.id, pickupId))
                .limit(1);

            if (!pickup) {
                throw new NotFoundError('Pickup not found');
            }

            if (!this.userCan.isAdmin() && pickup.ownerUserId !== ownerUserId) {
                throw new ForbiddenError('You are not authorized to add items to this pickup');
            }

            const [item] = await this.db
                .insert(items)
                .values({
                    pickupId,
                    category: input.category,
                    model: input.model || null,
                    serialOrImei: input.serialOrImei || null,
                    estimatedWeightLb: input.estimatedWeightLb?.toString() || '0',
                    clientShippingUsd: input.clientShippingUsd?.toString() || '0',
                })
                .returning();

            this.log('item_add', { itemId: item.id, pickupId });

            return itemResponseSchema.parse(item);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'ItemService.addToPickup' });
            throw apiError;
        }
    }

    /**
     * Get an item by ID.
     */
    public async getById(id: number): Promise<ItemResponse> {
        try {
            const ownerUserId = this.requireUserId();

            const [item] = await this.db
                .select()
                .from(items)
                .where(eq(items.id, id))
                .limit(1);

            if (!item) {
                throw new NotFoundError('Item not found');
            }

            // Check pickup ownership
            const [pickup] = await this.db
                .select()
                .from(pickups)
                .where(eq(pickups.id, item.pickupId))
                .limit(1);

            if (!pickup) {
                throw new NotFoundError('Associated pickup not found');
            }

            if (!this.userCan.isAdmin() && pickup.ownerUserId !== ownerUserId) {
                throw new ForbiddenError('You are not authorized to view this item');
            }

            return itemResponseSchema.parse(item);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'ItemService.getById' });
            throw apiError;
        }
    }

    /**
     * List items in a pickup.
     */
    public async listByPickup(pickupId: number): Promise<ItemResponse[]> {
        try {
            const ownerUserId = this.requireUserId();

            if (!this.userCan.canList(Resources.ITEMS)) {
                throw new ForbiddenError('You are not authorized to list items');
            }

            // Verify pickup exists and belongs to user
            const [pickup] = await this.db
                .select()
                .from(pickups)
                .where(eq(pickups.id, pickupId))
                .limit(1);

            if (!pickup) {
                throw new NotFoundError('Pickup not found');
            }

            if (!this.userCan.isAdmin() && pickup.ownerUserId !== ownerUserId) {
                throw new ForbiddenError('You are not authorized to view items in this pickup');
            }

            const results = await this.db
                .select()
                .from(items)
                .where(eq(items.pickupId, pickupId))
                .orderBy(desc(items.createdAt));

            return results.map((r) => itemResponseSchema.parse(r));
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'ItemService.listByPickup' });
            throw apiError;
        }
    }

    /**
     * Update an item.
     */
    public async update(id: number, input: UpdateItemInput): Promise<ItemResponse> {
        try {
            const ownerUserId = this.requireUserId();

            // Get item and verify ownership
            const existing = await this.getById(id);

            // Get pickup to check ownership
            const [pickup] = await this.db
                .select()
                .from(pickups)
                .where(eq(pickups.id, existing.pickupId))
                .limit(1);

            if (!this.userCan.canUpdate(Resources.ITEMS, { ownerUserId: pickup?.ownerUserId })) {
                throw new ForbiddenError('You are not authorized to update this item');
            }

            const updateData: Record<string, unknown> = {};

            if (input.category !== undefined) updateData.category = input.category;
            if (input.model !== undefined) updateData.model = input.model;
            if (input.serialOrImei !== undefined) updateData.serialOrImei = input.serialOrImei;
            if (input.estimatedWeightLb !== undefined) updateData.estimatedWeightLb = input.estimatedWeightLb.toString();
            if (input.clientShippingUsd !== undefined) updateData.clientShippingUsd = input.clientShippingUsd.toString();

            const [updated] = await this.db
                .update(items)
                .set(updateData)
                .where(eq(items.id, id))
                .returning();

            this.log('item_update', { itemId: id, updates: Object.keys(input) });

            return itemResponseSchema.parse(updated);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'ItemService.update' });
            throw apiError;
        }
    }

    /**
     * Delete an item.
     */
    public async delete(id: number): Promise<void> {
        try {
            const ownerUserId = this.requireUserId();

            // Get item and verify ownership
            const existing = await this.getById(id);

            // Get pickup to check ownership
            const [pickup] = await this.db
                .select()
                .from(pickups)
                .where(eq(pickups.id, existing.pickupId))
                .limit(1);

            if (!this.userCan.canDelete(Resources.ITEMS, { ownerUserId: pickup?.ownerUserId })) {
                throw new ForbiddenError('You are not authorized to delete this item');
            }

            await this.db.delete(items).where(eq(items.id, id));

            this.log('item_delete', { itemId: id });
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'ItemService.delete' });
            throw apiError;
        }
    }
}
