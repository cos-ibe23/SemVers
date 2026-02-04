import { resolve } from 'node:path'

export default defineNuxtConfig({
  rootDir: __dirname,

  css: [resolve(__dirname, 'assets/css/main.css')],

  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
    },
  },
})
