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

const clientUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
});

const shipperClientSchema = z.object({
    shipperId: z.string(),
    clientId: z.string(),
    nickname: z.string().nullable(),
    phone: z.string().nullable(),
    createdAt: z.string(),
    client: clientUserSchema,
});

export const listClients = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'get',
    path: '/clients',
    request: {
        query: searchPaginationQuerySchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(paginatedSchema(shipperClientSchema), 'List of clients'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('The unauthorized response when not authenticated'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('The forbidden response when not authorized'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('The internal server error response'),
    },
});

export const addClient = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'post',
    path: '/clients',
    request: {
        body: jsonContentRequired(
            z.object({
                clientUserId: z.string().optional(),
                name: z.string().min(1).max(255).optional(),
                email: z.string().email().optional(),
                nickname: z.string().max(255).optional(),
                phone: z.string().max(50).optional(),
            }).refine(
                (data) => data.clientUserId || (data.name && data.email),
                { message: 'Either clientUserId or both name and email are required' }
            ),
            'Add client request'
        ),
    },
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(shipperClientSchema, 'Client added'),
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
    tags: ['v1-clients'],
    method: 'get',
    path: '/clients/{clientId}',
    request: {
        params: z.object({
            clientId: z.string(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(shipperClientSchema, 'Client details'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('The unauthorized response when not authenticated'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('The forbidden response when not authorized'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('The not found response when client not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('The internal server error response'),
    },
});

export const updateClient = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'patch',
    path: '/clients/{clientId}',
    request: {
        params: z.object({
            clientId: z.string(),
        }),
        body: jsonContentRequired(
            z.object({
                nickname: z.string().max(255).nullable().optional(),
                phone: z.string().max(50).nullable().optional(),
            }),
            'Update client request'
        ),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(shipperClientSchema, 'Client updated'),
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
    tags: ['v1-clients'],
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
