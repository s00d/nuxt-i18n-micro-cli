import { defineCommand } from 'citty'
import consola from 'consola'
import pPkg from '../package.json' assert { type: 'json' }
import { commands } from './commands'

export const main = defineCommand({
  meta: {
    name: pPkg.name,
    version: pPkg.version,
    description: pPkg.description,
  },
  subCommands: commands,
  setup() {
    consola.info('Setup')
  },
  cleanup() {
    consola.info('Cleanup')
  },
})
