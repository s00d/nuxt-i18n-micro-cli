import { defineCommand } from 'citty'
import pPkg from '../package.json' assert { type: 'json' }
import { commands } from './commands'
import consola from "consola";

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
