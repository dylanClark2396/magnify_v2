// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxt/ui'],
  ssr: false,
  app: {
    head: {
      title: 'Magnify'
    }
  },
  runtimeConfig: {
    public: {
      wsUrl: process.env.WS_URL || 'ws://localhost:8080',
      apiBase: 'https://kbptpvsmdk.execute-api.us-east-1.amazonaws.com'
    }
  },
  colorMode: {
    preference: 'dark'
  }
})