export default defineNuxtPlugin((nuxtApp) => {
  const toastTitle = nuxtApp.$t('plugins.nuxtNotify.title')
  const toastBody = nuxtApp.$t(
    'plugins.nuxtNotify.body',
  )
  const alertCount = nuxtApp.$tc('plugins.nuxtNotify.alerts', 2)
  void toastTitle
  void toastBody
  void alertCount
})
