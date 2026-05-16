import { defineCommand } from 'citty'
import { cliDescription, cliName, cliVersion } from './package-meta'
import { commands } from './commands'

export const main = defineCommand({
  meta: {
    name: cliName,
    version: cliVersion,
    description: cliDescription,
  },
  subCommands: commands,
})
