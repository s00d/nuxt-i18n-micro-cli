import { join } from 'pathe'
import { cliCommandFailedError } from '../errors'
import { spawn } from 'node:child_process'
import { parseJsonFile, writeJsonFile } from '../utils/json'
import { ensureDirectoryExists, pathExists } from '../utils/dir'
import { deleteFile, removeDirectory, writeTextFile } from '../utils/file'

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
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      }
      else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })

    proc.on('error', reject)
  })
}

function detectPackageManager(projectPath: string): 'npm' | 'yarn' | 'pnpm' {
  if (pathExists(join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm'
  if (pathExists(join(projectPath, 'yarn.lock'))) return 'yarn'
  if (pathExists(join(projectPath, 'package-lock.json'))) return 'npm'
  return 'npm'
}

function updatePackageJson(projectPath: string, packageName: string): void {
  const packageJsonPath = join(projectPath, 'package.json')
  const packageJson = parseJsonFile(packageJsonPath) as Record<string, unknown>
  const dependencies = (packageJson.dependencies || {}) as Record<string, unknown>
  dependencies[packageName] = 'latest'
  packageJson.dependencies = dependencies
  writeJsonFile(packageJsonPath, packageJson)
}

export async function initializeProjectScaffold(params: {
  targetDir: string
  projectName: string
  packageName: string
}): Promise<{ projectPath: string, packageManager: 'npm' | 'yarn' | 'pnpm' }> {
  const projectPath = join(params.targetDir, params.projectName)
  if (pathExists(projectPath)) {
    throw cliCommandFailedError(`Directory ${params.projectName} already exists`, [
      'Choose another project name or remove the existing directory.',
    ], {
      Path: projectPath,
    })
  }

  try {
    await runCommand('npx', ['nuxi@latest', 'init', params.projectName], params.targetDir)
    const packageManager = detectPackageManager(projectPath)
    updatePackageJson(projectPath, params.packageName)

    const dirs = ['pages', 'locales']
    for (const dir of dirs) {
      ensureDirectoryExists(join(projectPath, dir))
    }

    const appVuePath = join(projectPath, 'app.vue')
    if (pathExists(appVuePath)) {
      deleteFile(appVuePath)
    }

    writeTextFile(join(projectPath, 'pages/index.vue'), INDEX_PAGE)
    writeTextFile(join(projectPath, 'pages/about.vue'), ABOUT_PAGE)

    for (const [locale, translations] of Object.entries(DEFAULT_TRANSLATIONS)) {
      writeJsonFile(join(projectPath, `locales/${locale}.json`), translations)
    }

    writeTextFile(join(projectPath, 'nuxt.config.ts'), NUXT_CONFIG)
    return { projectPath, packageManager }
  }
  catch (error) {
    if (pathExists(projectPath)) {
      removeDirectory(projectPath)
    }
    throw error
  }
}
