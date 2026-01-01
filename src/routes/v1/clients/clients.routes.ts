import { createRoute, z } from '@hono/zod-openapi';
import { authenticated } from '../../../middlewares';
import {
    jsonContent,
    jsonContentRequired,
    jsonApiErrorContent,
    paginatedSchema,
    searchPaginationQuerySchema,
} from '../../../lib/openapi/helpers';

// Client schema for responses
const clientSchema = z.object({
    id: z.number(),
    ownerUserId: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    createdAt: z.string(),
});

// GET /v1/clients - List clients with pagination and search
export const listClients = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'get',
    path: '/clients',
    request: {
        query: searchPaginationQuerySchema,
    },
    responses: {
        200: jsonContent(paginatedSchema(clientSchema), 'List of clients'),
        401: jsonApiErrorContent('Not authenticated'),
    },
});

// POST /v1/clients - Create a new client
export const createClient = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'post',
    path: '/clients',
    request: {
        body: jsonContentRequired(
            z.object({
                name: z.string().min(1).max(255),
                email: z.string().email().optional(),
                phone: z.string().max(50).optional(),
            }),
            'Client creation request'
        ),
    },
    responses: {
        201: jsonContent(clientSchema, 'Client created'),
        401: jsonApiErrorContent('Not authenticated'),
        422: jsonApiErrorContent('Validation error'),
    },
});

// GET /v1/clients/:id - Get client by ID
export const getClient = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'get',
    path: '/clients/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        200: jsonContent(clientSchema, 'Client details'),
        401: jsonApiErrorContent('Not authenticated'),
        404: jsonApiErrorContent('Client not found'),
    },
});

// PATCH /v1/clients/:id - Update client
export const updateClient = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'patch',
    path: '/clients/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
        body: jsonContentRequired(
            z.object({
                name: z.string().min(1).max(255).optional(),
                email: z.string().email().nullable().optional(),
                phone: z.string().max(50).nullable().optional(),
            }),
            'Client update request'
        ),
    },
    responses: {
        200: jsonContent(clientSchema, 'Client updated'),
        401: jsonApiErrorContent('Not authenticated'),
        404: jsonApiErrorContent('Client not found'),
        422: jsonApiErrorContent('Validation error'),
    },
});

// DELETE /v1/clients/:id - Soft delete client
export const deleteClient = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'delete',
    path: '/clients/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        200: jsonContent(z.object({ success: z.boolean() }), 'Client deleted'),
        401: jsonApiErrorContent('Not authenticated'),
        404: jsonApiErrorContent('Client not found'),
    },
});

export type ListClientsRoute = typeof listClients;
export type CreateClientRoute = typeof createClient;
export type GetClientRoute = typeof getClient;
export type UpdateClientRoute = typeof updateClient;
export type DeleteClientRoute = typeof deleteClient;
