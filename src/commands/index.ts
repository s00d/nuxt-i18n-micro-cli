import type { CommandDef } from 'citty'

const _rDefault = (r: any) => (r.default || r) as Promise<CommandDef>

export const commands = {
  'info': () => import('./info').then(_rDefault),
  'format': () => import('./format').then(_rDefault),
  'split': () => import('./split').then(_rDefault),
  'import': () => import('./import').then(_rDefault),
  'export': () => import('./export').then(_rDefault),
  'extract': () => import('./extract').then(_rDefault),
  'sync': () => import('./sync').then(_rDefault),
  'validate': () => import('./validate').then(_rDefault),
  'stats': () => import('./stats').then(_rDefault),
  'clean': () => import('./clean').then(_rDefault),
  'translate': () => import('./translate').then(_rDefault),
  'export-csv': () => import('./export-csv').then(_rDefault),
  'import-csv': () => import('./import-csv').then(_rDefault),
  'diff': () => import('./diff').then(_rDefault),
  'check-duplicates': () => import('./check-duplicates').then(_rDefault),
  'replace-values': () => import('./replace-values').then(_rDefault),
  'text-to-i18n': () => import('./text-to-i18n').then(_rDefault),
  'backup': () => import('./backup').then(_rDefault),
  'restore': () => import('./restore').then(_rDefault),
  'lint': () => import('./lint').then(_rDefault),
} as const
