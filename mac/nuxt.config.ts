// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@vueuse/nuxt"],
  runtimeConfig: {
    openai_key: process.env.OPENAI_KEY,
  },
  ssr: false,
});
