import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: false },
  compatibilityDate: '2024-08-14',
  i18n: {
    fallbackLocale: 'en',
    translationDir: 'locales',
  },
})
