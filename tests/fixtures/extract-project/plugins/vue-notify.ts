import type { App } from 'vue'

export const vueNotifyPlugin = {
  install(app: App) {
    const title = app.config.globalProperties.$t('plugins.vueNotify.title')
    const description = app.config.globalProperties.$t('plugins.vueNotify.description')
    void title
    void description
  },
}
