import { createAuthClient } from "better-auth/vue"

// Use runtime config to get the API URL (set in .env)
const getBaseUrl = () => {
    // 1. Try Nuxt Runtime Config
    try {
        const config = useRuntimeConfig()
        return config.public.apiBase
    } catch (e) {
        // useRuntimeConfig not available (outside context)
    }

    // 2. Try process.env (Vite often replaces this string at build time)
    if (typeof process !== 'undefined' && process.env?.NUXT_PUBLIC_API_BASE) {
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
