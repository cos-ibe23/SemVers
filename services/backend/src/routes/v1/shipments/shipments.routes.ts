import { createRoute, z } from '@hono/zod-openapi';
import { authenticated } from '../../../middlewares';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { jsonContent, jsonApiErrorContent } from '../../../lib/openapi/helpers';
import { boxResponseSchema } from '../../../db/schema/boxes';

const TAGS = ['v1-shipments'] as const;

export const list = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/shipments',
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.array(boxResponseSchema),
            'List of shipments (Shipped/Delivered boxes)'
        ),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal Server Error'),
    },
});

export const create = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/shipments',
    request: {
        body: jsonContent(
            z.object({
                boxId: z.number(),
            }),
            'Create shipment from open box'
        ),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(boxResponseSchema, 'Created Shipment (Box set to SHIPPED)'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Invalid box status or not found'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Box not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal Server Error'),
    },
});

export const getOne = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/shipments/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(boxResponseSchema, 'Shipment details'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Shipment not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal Server Error'),
    },
});

export const manifest = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/shipments/{id}/manifest',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(boxResponseSchema, 'Shipment manifest details'), // Reusing box schema for now, can be specialized
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Shipment not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal Server Error'),
    },
});

export const deliver = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/shipments/{id}/deliver',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(boxResponseSchema, 'Shipment marked as DELIVERED'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Shipment not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal Server Error'),
    },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type ManifestRoute = typeof manifest;
export type DeliverRoute = typeof deliver;
