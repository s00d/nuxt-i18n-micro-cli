import path from 'node:path'
import fs from 'node:fs'
import { resolve } from 'pathe'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { input } from '@inquirer/prompts'
import { initializeProjectScaffold } from '../core/services/InitService'
import { sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'init',
    description: 'Initialize a new Nuxt 3 project with nuxt-i18n-micro',
  },
  args: {
    ...sharedArgs,
  },
  async run({ args }) {
    const targetDir = resolve(args.cwd || '.')
    const PACKAGE_NAME = 'nuxt-i18n-micro'
    const projectName = await input({
      message: 'Enter project name:',
      validate: (input: string) => {
        if (!input) return 'Project name is required'
        if (fs.existsSync(path.join(targetDir, input))) {
          return 'Directory already exists'
        }
        return true
      },
    })

    const { projectPath, packageManager } = await initializeProjectScaffold({
      targetDir,
      projectName,
      packageName: PACKAGE_NAME,
    })
    process.chdir(projectPath)

    consola.success('Project initialized successfully!')
    consola.info('\nNext steps:')
    consola.info('1. cd ' + projectName)
    consola.info(`2. ${packageManager} install`)
    consola.info(`3. ${packageManager} run dev`)
    consola.info('4. Open http://localhost:3000 in your browser')
  },
})
