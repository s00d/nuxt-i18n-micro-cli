import { defineCommand } from 'citty'
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
    console.log('Setup')
  },
  cleanup() {
    console.log('Cleanup')
  },
})
