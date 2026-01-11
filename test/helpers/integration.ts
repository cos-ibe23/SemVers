import app from '../../src/app';
import { env } from '../../src/env';

/**
 * Returns the main application instance for integration testing.
 * This app includes all real middleware, routes, and authentication logic.
 */
export function createIntegrationTestApp() {
    return app;
}

/**
 * Helper to signup and login a user via the API.
 * Returns the user object and authentication headers.
 */
export async function signupAndLogin(
    email: string, 
    name: string, 
    password = 'password123'
) {
    const origin = env.BETTER_AUTH_URL || 'http://localhost:4000';

    // 1. Signup
    const signupRes = await app.request('/v1/auth/sign-up/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': origin,
        },
        body: JSON.stringify({
            email,
            password,
            name,
        }),
    });

    if (!signupRes.ok) {
        const error = await signupRes.text();
        throw new Error(`Signup failed: ${signupRes.status} ${error}`);
    }

    // 2. Login
    const loginRes = await app.request('/v1/auth/sign-in/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': origin,
        },
        body: JSON.stringify({
            email,
            password,
        }),
    });

    if (!loginRes.ok) {
        const error = await loginRes.text();
        throw new Error(`Login failed: ${loginRes.status} ${error}`);
    }

    const body = await loginRes.json();

    // Extract token
    // Not all Better Auth configurations return the token in the same place.
    // Based on src/db/auth.ts comment: "token is returned in 'set-auth-token' response header"
    // Also likely in the body if using standard client, but let's check headers first.
    // Actually, for bearer plugin, typically the token IS the session token?
    
    // We will try to capture cookies as well, just in case.
    const cookie = loginRes.headers.get('set-cookie');
    
    // We will also look for the token in the body if available (some setups do this)
    // or specifically the header mentioned in auth.ts
    // Note: With Hono/Fetch, headers are case-insensitive usually.
    // 'set-auth-token' is standard for some better-auth plugins?
    
    // Let's create headers for subsequent requests
    const authHeaders: Record<string, string> = {
        'Origin': origin,
    };

    if (cookie) {
        authHeaders['Cookie'] = cookie;
    }

    // Attempt to find bearer token
    // The 'bearer' plugin typically allows using the Session Token as a Bearer token.
    // Inspect body.token or body.session?.token
    let token = body.token || body.session?.token;
    
    if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
    }

    return {
        user: body.user,
        session: body.session,
        token,
        headers: authHeaders,
    };
}
