import { createRoute, z } from '@hono/zod-openapi';
import { authenticated } from '../../../middlewares';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import {
    jsonContent,
    jsonContentRequired,
    jsonApiErrorContent,
    paginatedSchema,
    searchPaginationQuerySchema,
} from '../../../lib/openapi/helpers';
import {
    shipperClientResponseSchema,
    addClientRequestSchema,
    updateClientRequestSchema,
} from '../../../db/schema/shipper-clients';

// Tag for all client routes
const TAGS = ['v1-clients'] as const;

export const listClients = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/clients',
    request: {
        query: searchPaginationQuerySchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(paginatedSchema(shipperClientResponseSchema), 'List of clients'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('The unauthorized response when not authenticated'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('The forbidden response when not authorized'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('The internal server error response'),
    },
});

export const addClient = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/clients',
    request: {
        body: jsonContentRequired(addClientRequestSchema, 'Add client request'),
    },
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(shipperClientResponseSchema, 'Client added'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('The bad request response'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('The unauthorized response when not authenticated'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('The forbidden response when not authorized'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('The not found response when client user not found'),
        [HttpStatusCodes.CONFLICT]: jsonApiErrorContent('The conflict response when client already exists'),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiErrorContent('The validation error response'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('The internal server error response'),
    },
});

export const getClient = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/clients/{clientId}',
    request: {
        params: z.object({
            clientId: z.string(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(shipperClientResponseSchema, 'Client details'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('The unauthorized response when not authenticated'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('The forbidden response when not authorized'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('The not found response when client not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('The internal server error response'),
    },
});

export const updateClient = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'patch',
    path: '/clients/{clientId}',
    request: {
        params: z.object({
            clientId: z.string(),
        }),
        body: jsonContentRequired(updateClientRequestSchema, 'Update client request'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(shipperClientResponseSchema, 'Client updated'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('The bad request response'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('The unauthorized response when not authenticated'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('The forbidden response when not authorized'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('The not found response when client not found'),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiErrorContent('The validation error response'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('The internal server error response'),
    },
});

export const removeClient = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'delete',
    path: '/clients/{clientId}',
    request: {
        params: z.object({
            clientId: z.string(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Client removed'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('The unauthorized response when not authenticated'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('The forbidden response when not authorized'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('The not found response when client not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('The internal server error response'),
    },
});

export type ListClientsRoute = typeof listClients;
export type AddClientRoute = typeof addClient;
export type GetClientRoute = typeof getClient;
export type UpdateClientRoute = typeof updateClient;
export type RemoveClientRoute = typeof removeClient;
