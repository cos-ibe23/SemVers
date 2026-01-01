import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppBindings } from '../../src/lib/types';

/**
 * Fixture for testing clients endpoints
 */
export class ClientsFixture {
    private app: OpenAPIHono<AppBindings>;
    private cookieHeader: string;

    constructor(app: OpenAPIHono<AppBindings>, cookieHeader: string = '') {
        this.app = app;
        this.cookieHeader = cookieHeader;
    }

    /**
     * Set the auth cookie header
     */
    setCookieHeader(cookieHeader: string) {
        this.cookieHeader = cookieHeader;
    }

    /**
     * List clients
     */
    async listClients(query: { page?: number; limit?: number; search?: string } = {}) {
        const params = new URLSearchParams();
        if (query.page) params.set('page', String(query.page));
        if (query.limit) params.set('limit', String(query.limit));
        if (query.search) params.set('search', query.search);

        const url = `/v1/clients${params.toString() ? `?${params}` : ''}`;

        return this.app.request(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(this.cookieHeader && { Cookie: this.cookieHeader }),
            },
        });
    }

    /**
     * Create a client
     */
    async createClient(data: { name: string; email?: string; phone?: string }) {
        return this.app.request('/v1/clients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.cookieHeader && { Cookie: this.cookieHeader }),
            },
            body: JSON.stringify(data),
        });
    }

    /**
     * Get a client by ID
     */
    async getClient(id: number) {
        return this.app.request(`/v1/clients/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(this.cookieHeader && { Cookie: this.cookieHeader }),
            },
        });
    }

    /**
     * Update a client
     */
    async updateClient(id: number, data: { name?: string; email?: string | null; phone?: string | null }) {
        return this.app.request(`/v1/clients/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(this.cookieHeader && { Cookie: this.cookieHeader }),
            },
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete a client
     */
    async deleteClient(id: number) {
        return this.app.request(`/v1/clients/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(this.cookieHeader && { Cookie: this.cookieHeader }),
            },
        });
    }
}
