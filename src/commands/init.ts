import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { resolve } from 'pathe'
import { defineCommand } from 'citty'
import consola from 'consola'
import { input } from '@inquirer/prompts'
import { sharedArgs } from './_shared'

const DEFAULT_LOCALES = [
  { code: 'en', iso: 'en_EN' },
  { code: 'de', iso: 'de_DE' },
  { code: 'ru', iso: 'ru_RU' },
]

const DEFAULT_TRANSLATIONS = {
  en: {
    welcome: 'Welcome to Nuxt 3',
    description: 'This is a sample page with i18n support',
    navigation: {
      home: 'Home',
      about: 'About',
    },
  },
  de: {
    welcome: 'Willkommen bei Nuxt 3',
    description: 'Dies ist eine Beispielseite mit i18n-Unterstützung',
    navigation: {
      home: 'Startseite',
      about: 'Über uns',
    },
  },
  ru: {
    welcome: 'Добро пожаловать в Nuxt 3',
    description: 'Это пример страницы с поддержкой i18n',
    navigation: {
      home: 'Главная',
      about: 'О нас',
    },
  },
}

const INDEX_PAGE = `<template>
  <div class="container">
    <h1>{{ $t('welcome') }}</h1>
    <p>{{ $t('description') }}</p>
    
    <nav>
      <NuxtLink to="/">{{ $t('navigation.home') }}</NuxtLink> |
      <NuxtLink to="/about">{{ $t('navigation.about') }}</NuxtLink>
    </nav>

    <div class="language-switcher">
      <select v-model="$i18n.locale">
        <option v-for="locale in $i18n.locales" :key="locale.code" :value="locale.code">
          {{ locale.code.toUpperCase() }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

nav {
  margin: 2rem 0;
}

nav a {
  margin: 0 1rem;
  color: #3b82f6;
  text-decoration: none;
}

nav a:hover {
  text-decoration: underline;
}

.language-switcher {
  margin-top: 2rem;
}

select {
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #e5e7eb;
}
</style>`

const ABOUT_PAGE = `<template>
  <div class="container">
    <h1>{{ $t('navigation.about') }}</h1>
    <p>{{ $t('description') }}</p>
    
    <nav>
      <NuxtLink to="/">{{ $t('navigation.home') }}</NuxtLink> |
      <NuxtLink to="/about">{{ $t('navigation.about') }}</NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

nav {
  margin: 2rem 0;
}

nav a {
  margin: 0 1rem;
  color: #3b82f6;
  text-decoration: none;
}

nav a:hover {
  text-decoration: underline;
}
</style>`

const NUXT_CONFIG = `import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    'nuxt-i18n-micro',
  ],
  i18n: {
    locales: ${JSON.stringify(DEFAULT_LOCALES, null, 2)},
    meta: true,
    defaultLocale: 'en',
    translationDir: 'locales',
    autoDetectLanguage: true,
    autoDetectPath: '/',
  },
  devtools: { enabled: true },
})`

async function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    })

    process.on('close', (code) => {
      if (code === 0) {
        resolve()
      }
      else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })

    process.on('error', (err) => {
      reject(err)
    })
  })
}

function detectPackageManager(projectPath: string): 'npm' | 'yarn' | 'pnpm' {
  if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
    return 'yarn'
  }
  if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) {
    return 'npm'
  }
  // По умолчанию используем npm, так как nuxi init создает проект с npm
  return 'npm'
}

function updatePackageJson(projectPath: string, packageName: string) {
  const packageJsonPath = path.join(projectPath, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

  packageJson.dependencies = packageJson.dependencies || {}
  packageJson.dependencies[packageName] = 'latest'

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  consola.info(`Added ${packageName}@latest to package.json`)
}

export default defineCommand({
  meta: {
    name: 'init',
    description: 'Initialize a new Nuxt 3 project with nuxt-i18n-micro',
  },
  args: {
    ...sharedArgs,
  },
  async run({ args }) {
    const targetDir = resolve(args.cwd?.toString() || '.')
    const PACKAGE_NAME = 'nuxt-i18n-micro'
    let projectPath = ''

    try {
      // Запрашиваем имя проекта у пользователя
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

      projectPath = path.join(targetDir, projectName)
      consola.info('Project path:', projectPath)

      // Check if directory exists
      if (fs.existsSync(projectPath)) {
        throw new Error(`Directory ${projectName} already exists`)
      }

      // Create new Nuxt project
      consola.info(`Creating new Nuxt 3 project: ${projectName}`)

      // Create project with nuxi
      try {
        await runCommand('npx', ['nuxi@latest', 'init', projectName], targetDir)
      }
      catch (error) {
        consola.error('Failed to create Nuxt project:', error)
        throw error
      }

      // Определяем пакетный менеджер
      const packageManager = detectPackageManager(projectPath)
      consola.info('Detected package manager:', packageManager)

      // Добавляем пакет в package.json
      updatePackageJson(projectPath, PACKAGE_NAME)

      // Change to project directory
      process.chdir(projectPath)
      consola.info('Changed working directory to:', projectPath)

      // Create necessary directories
      const dirs = ['pages', 'locales']
      for (const dir of dirs) {
        const dirPath = path.join(projectPath, dir)
        fs.mkdirSync(dirPath, { recursive: true })
        consola.info('Created directory:', dirPath)
      }

      // Remove default app.vue
      const appVuePath = path.join(projectPath, 'app.vue')
      if (fs.existsSync(appVuePath)) {
        fs.unlinkSync(appVuePath)
        consola.info('Removed default app.vue')
      }

      // Create pages
      const indexPagePath = path.join(projectPath, 'pages/index.vue')
      const aboutPagePath = path.join(projectPath, 'pages/about.vue')
      fs.writeFileSync(indexPagePath, INDEX_PAGE)
      fs.writeFileSync(aboutPagePath, ABOUT_PAGE)
      consola.info('Created pages:', indexPagePath, aboutPagePath)

      // Create translation files
      for (const [locale, translations] of Object.entries(DEFAULT_TRANSLATIONS)) {
        const localePath = path.join(projectPath, `locales/${locale}.json`)
        fs.writeFileSync(
          localePath,
          JSON.stringify(translations, null, 2),
        )
        consola.info('Created locale file:', localePath)
      }

      // Update nuxt.config.ts
      const configPath = path.join(projectPath, 'nuxt.config.ts')
      fs.writeFileSync(configPath, NUXT_CONFIG)
      consola.info('Updated nuxt.config.ts:', configPath)

      consola.success('Project initialized successfully!')
      consola.info('\nNext steps:')
      consola.info('1. cd ' + projectName)
      consola.info(`2. ${packageManager} install`)
      consola.info(`3. ${packageManager} run dev`)
      consola.info('4. Open http://localhost:3000 in your browser')
    }
    catch (error) {
      consola.error('Failed to initialize project:', error)

      // Cleanup on failure
      if (projectPath && fs.existsSync(projectPath)) {
        consola.info('Cleaning up...')
        fs.rmSync(projectPath, { recursive: true, force: true })
      }

      throw error
    }
  },
})
