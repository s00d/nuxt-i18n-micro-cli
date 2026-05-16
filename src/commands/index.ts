import type { CommandDef } from 'citty'
import { wrapCommandWithCliErrorHandler } from '../core/utils/safe-command'

function loadCommand(loader: () => Promise<CommandDef>): () => Promise<CommandDef> {
  return () => loader().then(command => wrapCommandWithCliErrorHandler(command))
}

export const commands = {
  'init': loadCommand(() => import('./init').then(m => m.default as CommandDef)),
  'info': loadCommand(() => import('./info').then(m => m.default as CommandDef)),
  'format': loadCommand(() => import('./format').then(m => m.default as CommandDef)),
  'split': loadCommand(() => import('./split').then(m => m.default as CommandDef)),
  'import': loadCommand(() => import('./import').then(m => m.default as CommandDef)),
  'export': loadCommand(() => import('./export').then(m => m.default as CommandDef)),
  'extract': loadCommand(() => import('./extract').then(m => m.default as CommandDef)),
  'sync': loadCommand(() => import('./sync').then(m => m.default as CommandDef)),
  'sync-remote': loadCommand(() => import('./sync-remote').then(m => m.default as CommandDef)),
  'validate': loadCommand(() => import('./validate').then(m => m.default as CommandDef)),
  'stats': loadCommand(() => import('./stats').then(m => m.default as CommandDef)),
  'clean': loadCommand(() => import('./clean').then(m => m.default as CommandDef)),
  'translate': loadCommand(() => import('./translate').then(m => m.default as CommandDef)),
  'export-csv': loadCommand(() => import('./export-csv').then(m => m.default as CommandDef)),
  'import-csv': loadCommand(() => import('./import-csv').then(m => m.default as CommandDef)),
  'diff': loadCommand(() => import('./diff').then(m => m.default as CommandDef)),
  'check-duplicates': loadCommand(() => import('./check-duplicates').then(m => m.default as CommandDef)),
  'replace-values': loadCommand(() => import('./replace-values').then(m => m.default as CommandDef)),
  'optimize': loadCommand(() => import('./optimize').then(m => m.default as CommandDef)),
  'text-to-i18n': loadCommand(() => import('./text-to-i18n').then(m => m.default as CommandDef)),
  'search': loadCommand(() => import('./search').then(m => m.default as CommandDef)),
  'rename': loadCommand(() => import('./rename').then(m => m.default as CommandDef)),
  'pseudo': loadCommand(() => import('./pseudo').then(m => m.default as CommandDef)),
  'estimate': loadCommand(() => import('./estimate').then(m => m.default as CommandDef)),
  'glossary': loadCommand(() => import('./glossary').then(m => m.default as CommandDef)),
  'backup': loadCommand(() => import('./backup').then(m => m.default as CommandDef)),
  'restore': loadCommand(() => import('./restore').then(m => m.default as CommandDef)),
  'lint': loadCommand(() => import('./lint').then(m => m.default as CommandDef)),
} as const
