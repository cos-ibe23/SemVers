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
    pickupResponseSchema,
    createPickupBodySchema,
    updatePickupBodySchema,
} from '../../../db/schema/pickups';

const TAGS = ['v1-pickups'] as const;

const pickupStatusEnum = z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']);

export const listPickups = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/pickups',
    request: {
        query: z.object({
            page: z.coerce.number().min(1).default(1),
            limit: z.coerce.number().min(1).max(100).default(20),
            status: pickupStatusEnum.optional(),
            clientId: z.string().optional(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(paginatedSchema(pickupResponseSchema), 'List of pickups'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const getPickup = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/pickups/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(pickupResponseSchema, 'Pickup details'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Pickup not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const createPickup = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/pickups',
    request: {
        body: jsonContentRequired(createPickupBodySchema, 'Create pickup request'),
    },
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(pickupResponseSchema, 'Pickup created'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const updatePickup = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'patch',
    path: '/pickups/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
        body: jsonContentRequired(updatePickupBodySchema, 'Update pickup request'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(pickupResponseSchema, 'Pickup updated'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Pickup not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const deletePickup = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'delete',
    path: '/pickups/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Pickup deleted'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Pickup not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export type ListPickupsRoute = typeof listPickups;
export type GetPickupRoute = typeof getPickup;
export type CreatePickupRoute = typeof createPickup;
export type UpdatePickupRoute = typeof updatePickup;
export type DeletePickupRoute = typeof deletePickup;
