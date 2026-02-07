import { createAuthClient } from "better-auth/vue"

// Use runtime config to get the API URL (set in .env)
const getBaseUrl = (): string => {
    // Detect Server Environment
    const isServer = import.meta.server || typeof window === 'undefined';

    // SSR: Use relative root to route through Nuxt's proxy
    if (isServer) {
        return '';  // Empty string = relative to current origin
    }

    // Client-side: Use absolute origin only (no path)
    return window.location.origin;
}

let dispatcher: any;
if (import.meta.server) {
  const { Agent } = await import("undici");
  dispatcher = new Agent({
    keepAliveTimeout: 10,
    keepAliveMaxTimeout: 10,
  });
}

export const serverFetchOptions = {
      headers: import.meta.server ? {
          'Origin': 'https://imbod.com', // Spoof Origin for SSR backend checks
          'Connection': 'close'
      } : undefined,
      dispatcher,
      retry: 3,
      retryDelay: 1000,
}

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  basePath: "/v1/auth",  // Full path for both SSR and client
  fetchOptions: serverFetchOptions
})

export const {
  signIn,
  signOut,
  signUp,
  useSession
} = authClient
