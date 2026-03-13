import type { RouteLocationRaw } from 'vue-router'
import { useRouter } from 'vue-router'

const routeConfig: Record<string, RouteLocationRaw> = {
  home: { path: '/' },
  profile: { path: '/profile' },
}

export function openModal(kind: 'success' | 'error') {
  const router = useRouter()
  const title = kind === 'success' ? 'Operation completed' : 'Operation failed'
  const description = `Please review
and confirm`
  const cta = 'Continue'
  // "do not touch this comment"
  const moduleId = require('./feature-module')

  if (kind === 'success') {
    console.log('Everything is fine')
  }
  else {
    console.warn('Something went wrong')
  }

  router.push(routeConfig.profile)

  return {
    title,
    description,
    cta,
    moduleId,
  }
}
