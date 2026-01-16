import { createRoute, z } from '@hono/zod-openapi';
import { authenticated } from '../../../middlewares';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import {
    jsonContent,
    jsonContentRequired,
    jsonApiErrorContent,
    paginatedSchema,
} from '../../../lib/openapi/helpers';
import {
    boxResponseSchema,
    createBoxBodySchema,
    updateBoxBodySchema,
} from '../../../db/schema/boxes';
import { BOX_STATUSES } from '../../../constants/enums';

const TAGS = ['v1-boxes'] as const;

export const listBoxs = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/boxes',
    request: {
        query: z.object({
            filter: z.enum(['created', 'transferred', 'all']).optional(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.array(boxResponseSchema), 'List of boxes'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const createBox = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/boxes',
    request: {
        body: jsonContentRequired(createBoxBodySchema, 'Create box request'),
    },
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(boxResponseSchema, 'Box created'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const getBox = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/boxes/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(boxResponseSchema, 'Box details'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Box not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const updateBox = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'patch',
    path: '/boxes/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
        body: jsonContentRequired(updateBoxBodySchema, 'Update box request'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(boxResponseSchema, 'Box updated'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Box not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const transferBox = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/boxes/{id}/transfer',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
        body: jsonContentRequired(z.object({ newOwnerEmail: z.string().email() }), 'Transfer box request'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.object({
            success: z.boolean(),
            newOwnerId: z.string(),
        }), 'Box transferred'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Box not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const addPickupsToBox = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/boxes/{id}/pickups',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
        body: jsonContentRequired(z.object({ pickupIds: z.array(z.number()) }), 'Add pickups request'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(boxResponseSchema, 'Pickups added to box'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Box not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const removePickupFromBox = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'delete',
    path: '/boxes/{id}/pickups/{pickupId}',
    request: {
        params: z.object({
            id: z.coerce.number(),
            pickupId: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(boxResponseSchema, 'Pickup removed from box'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Box or Pickup not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const manageBoxItems = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/boxes/{id}/items',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
        body: jsonContentRequired(z.object({
            addItemIds: z.array(z.number()).optional(),
            removeItemIds: z.array(z.number()).optional(),
        }), 'Manage items request'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(boxResponseSchema, 'Items updated'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Box not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export type ListBoxsRoute = typeof listBoxs;
export type CreateBoxRoute = typeof createBox;
export type GetBoxRoute = typeof getBox;
export type UpdateBoxRoute = typeof updateBox;
export type TransferBoxRoute = typeof transferBox;
export type AddPickupsToBoxRoute = typeof addPickupsToBox;
export type RemovePickupFromBoxRoute = typeof removePickupFromBox;
export type ManageBoxItemsRoute = typeof manageBoxItems;
