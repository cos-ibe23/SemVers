import { createAuthClient } from "better-auth/vue"

// Use runtime config to get the API URL (set in .env)
const getBaseUrl = (): string => {
    // Detect Server Environment
    const isServer = import.meta.server || typeof window === 'undefined';

    // SSR: Use relative URL to route through Nuxt's proxy (defined in nuxt.config.ts)
    // This avoids direct pod-to-pod HTTP calls which are causing ECONNRESET
    if (isServer) {
        return '/v1';
    }

    // Client-side: Use runtime config or construct from window.location
    try {
        const config = useRuntimeConfig();
        if (config.public?.apiBase) {
            const apiBase = config.public.apiBase;
            // If relative, resolve to absolute
            if (apiBase.startsWith('/')) {
                return window.location.origin + apiBase;
            }
            return apiBase;
        }
    } catch (e) {
        // useRuntimeConfig not available
    }

    // Fallback: construct from current origin
    return window.location.origin + '/v1';
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
  basePath: "/auth",
  fetchOptions: serverFetchOptions
})

export const {
  signIn,
  signOut,
  signUp,
  useSession
} = authClient
