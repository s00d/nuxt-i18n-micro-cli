import type { CommandDef } from 'citty'

const _rDefault = (r: any) => (r.default || r) as Promise<CommandDef>

export const commands = {
  'import': () => import('./import').then(_rDefault),
  'export': () => import('./export').then(_rDefault),
  'extract': () => import('./extract').then(_rDefault),
} as const
