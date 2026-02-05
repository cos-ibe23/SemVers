import { resolve } from 'node:path'

export default defineNuxtConfig({
  rootDir: __dirname,

  css: [resolve(__dirname, 'assets/css/main.css')],

  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/v1',
    },
    apiProxyTarget: process.env.NUXT_API_PROXY_TARGET || 'http://localhost:4000',
  },

  routeRules: {
    '/v1/**': { proxy: process.env.NUXT_API_PROXY_TARGET ? `${process.env.NUXT_API_PROXY_TARGET}/**` : 'http://localhost:4000/v1/**' },
  },
})
