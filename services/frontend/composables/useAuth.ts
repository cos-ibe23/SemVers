import { createAuthClient } from "better-auth/vue"

// Use runtime config to get the API URL (set in .env)
const getBaseUrl = () => {
    // 1. Try Nuxt Runtime Config
    try {
        const config = useRuntimeConfig()
        
        // If on server, we need a full URL. Use the proxy target if available, or construct localhost URL
        if (import.meta.server) {
             return config.apiProxyTarget || 'http://localhost:3000/v1'
        }
        
        return config.public.apiBase
    } catch (e) {
        // useRuntimeConfig not available (outside context)
    }

    // 2. Try process.env (Vite often replaces this string at build time)
    if (typeof process !== 'undefined' && process.env?.NUXT_PUBLIC_API_BASE) {
         // If on server and NUXT_PUBLIC_API_BASE is relative, try to get proxy target
         if (process.env.NUXT_PUBLIC_API_BASE.startsWith('/') && process.env.NUXT_API_PROXY_TARGET) {
             return process.env.NUXT_API_PROXY_TARGET
         }
        // Fallback for process.env usage
        return process.env.NUXT_PUBLIC_API_BASE
    }

    // 3. Default Fallback
    console.warn('Could not resolve API URL from config or env, defaulting to production.')
    return "https://api.imbod.com"
}

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  basePath: "/v1/auth"
})

export const {
  signIn,
  signOut,
  signUp,
  useSession
} = authClient
