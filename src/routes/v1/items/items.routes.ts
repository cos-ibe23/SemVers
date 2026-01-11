import { createRoute, z } from '@hono/zod-openapi';
import { authenticated } from '../../../middlewares';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import {
    jsonContent,
    jsonContentRequired,
    jsonApiErrorContent,
} from '../../../lib/openapi/helpers';
import {
    itemResponseSchema,
    createItemRequestSchema,
    updateItemRequestSchema,
    itemTemplateSchema,
} from '../../../db/schema/items';

const TAGS = ['v1-items'] as const;

export const listPickupItems = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/pickups/{pickupId}/items',
    request: {
        params: z.object({
            pickupId: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.array(itemResponseSchema), 'List of items in pickup'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Pickup not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const addPickupItem = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/pickups/{pickupId}/items',
    request: {
        params: z.object({
            pickupId: z.coerce.number(),
        }),
        body: jsonContentRequired(createItemRequestSchema, 'Add item to pickup'),
    },
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(itemResponseSchema, 'Item added'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Pickup not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const getTemplates = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/items/templates',
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.array(itemTemplateSchema), 'List of item templates'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const getItem = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/items/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(itemResponseSchema, 'Item details'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Item not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const updateItem = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'patch',
    path: '/items/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
        body: jsonContentRequired(updateItemRequestSchema, 'Update item'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(itemResponseSchema, 'Item updated'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Item not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const deleteItem = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'delete',
    path: '/items/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Item deleted'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Item not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export type ListPickupItemsRoute = typeof listPickupItems;
export type AddPickupItemRoute = typeof addPickupItem;
export type GetTemplatesRoute = typeof getTemplates;
export type GetItemRoute = typeof getItem;
export type UpdateItemRoute = typeof updateItem;
export type DeleteItemRoute = typeof deleteItem;
