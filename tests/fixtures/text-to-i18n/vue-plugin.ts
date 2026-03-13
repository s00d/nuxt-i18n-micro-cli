import type { App } from 'vue'

export default {
  install(app: App) {
    const title = 'Vue plugin ready'
    const subtitle = 'Injecting global helpers'
    app.config.globalProperties.$notify = () => {
      return `${title}: ${subtitle}`
    }
  },
}
