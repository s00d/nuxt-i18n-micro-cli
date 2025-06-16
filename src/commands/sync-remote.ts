import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import axios from 'axios'
import { loadJsonFile, saveJsonFile, flattenTranslations } from '../utils/json'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

interface RemoteConfig {
  type: 'github' | 'gitlab' | 'custom'
  url: string
  branch?: string
  token?: string
  path?: string
  auth?: {
    username?: string
    password?: string
  }
}

interface SyncOptions {
  pull: boolean // Загружать переводы с удаленного хранилища
  push: boolean // Отправлять переводы в удаленное хранилище
  force: boolean // Принудительная синхронизация (перезапись)
  dryRun: boolean // Пробный запуск без реальных изменений
}

interface SyncResult {
  added: string[]
  updated: string[]
  deleted: string[]
  conflicts: Array<{
    key: string
    local: any
    remote: any
  }>
  errors: Array<{
    file: string
    error: string
  }>
}

interface SyncRemoteArgs {
  cwd?: string
  translationDir?: string
  pull?: boolean
  push?: boolean
  force?: boolean
  dryRun?: boolean
  logLevel?: string
}

async function loadRemoteConfig(cwd: string): Promise<RemoteConfig> {
  const configPath = path.join(cwd, '.i18n-remote.json')
  if (!fs.existsSync(configPath)) {
    throw new Error('Remote configuration file not found. Please run setup-remote first.')
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as RemoteConfig
    if (!config.type || !config.url) {
      throw new Error('Invalid remote configuration')
    }
    return config
  }
  catch (error) {
    throw new Error(`Failed to load remote configuration: ${error}`)
  }
}

async function validateRemoteConfig(config: RemoteConfig) {
  // Проверяем наличие необходимых параметров в зависимости от типа
  switch (config.type) {
    case 'github':
    case 'gitlab':
      if (!config.token) {
        throw new Error(`${config.type} token is required`)
      }
      break
    case 'custom':
      if (!config.auth?.username || !config.auth?.password) {
        throw new Error('Custom remote requires username and password')
      }
      break
  }

  // Проверяем URL
  try {
    new URL(config.url)
  }
  catch {
    throw new Error('Invalid remote URL')
  }
}

async function createAxiosInstance(config: RemoteConfig) {
  const baseURL = config.url.replace(/\/$/, '')
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  switch (config.type) {
    case 'github':
      instance.defaults.headers.common['Accept'] = 'application/vnd.github.v3+json'
      instance.defaults.headers.common['Authorization'] = `token ${config.token}`
      break
    case 'gitlab':
      instance.defaults.headers.common['PRIVATE-TOKEN'] = config.token!
      break
    case 'custom':
      instance.defaults.auth = {
        username: config.auth!.username!,
        password: config.auth!.password!,
      }
      break
  }

  return instance
}

async function fetchRemoteTranslations(config: RemoteConfig): Promise<Record<string, any>> {
  consola.info(`Fetching translations from ${config.type} remote...`)

  const translations: Record<string, any> = {}
  const apiPath = config.path || 'translations'
  const axiosInstance = await createAxiosInstance(config)

  try {
    switch (config.type) {
      case 'github': {
        // GitHub API endpoint для содержимого файла
        const apiUrl = `/repos${new URL(config.url).pathname}/contents/${apiPath}`
        const { data: files } = await axiosInstance.get(apiUrl)

        if (!Array.isArray(files)) {
          throw new TypeError('Invalid response from GitHub API')
        }

        // Загружаем каждый JSON файл
        for (const file of files) {
          if (file.type === 'file' && file.name.endsWith('.json')) {
            try {
              const { data: content } = await axiosInstance.get(file.download_url)
              const locale = file.name.replace('.json', '')
              translations[locale] = content
            }
            catch (error) {
              if (axios.isAxiosError(error)) {
                consola.warn(`Failed to download ${file.name}: ${error.response?.statusText || error.message}`)
              }
              continue
            }
          }
        }
        break
      }

      case 'gitlab': {
        // GitLab API endpoint для содержимого директории
        const projectPath = encodeURIComponent(new URL(config.url).pathname.slice(1))
        const apiUrl = `/api/v4/projects/${projectPath}/repository/tree`
        const { data: files } = await axiosInstance.get(apiUrl, {
          params: {
            path: apiPath,
            ref: config.branch || 'main',
          },
        })

        if (!Array.isArray(files)) {
          throw new TypeError('Invalid response from GitLab API')
        }

        // Загружаем каждый JSON файл
        for (const file of files) {
          if (file.type === 'blob' && file.name.endsWith('.json')) {
            try {
              const fileUrl = `/api/v4/projects/${projectPath}/repository/files/${encodeURIComponent(`${apiPath}/${file.name}`)}/raw`
              const { data: content } = await axiosInstance.get(fileUrl, {
                params: { ref: config.branch || 'main' },
                responseType: 'json',
              })
              const locale = file.name.replace('.json', '')
              translations[locale] = content
            }
            catch (error) {
              if (axios.isAxiosError(error)) {
                consola.warn(`Failed to download ${file.name}: ${error.response?.statusText || error.message}`)
              }
              continue
            }
          }
        }
        break
      }

      case 'custom': {
        // Для кастомного хранилища используем простой HTTP запрос
        const { data } = await axiosInstance.get(`/${apiPath}`)
        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid response from custom remote')
        }
        Object.assign(translations, data)
        break
      }
    }

    consola.success(`Successfully fetched translations for ${Object.keys(translations).length} locales`)
    return translations
  }
  catch (error) {
    if (axios.isAxiosError(error)) {
      consola.error(`Failed to fetch translations: ${error.response?.statusText || error.message}`)
    }
    else {
      consola.error(`Failed to fetch translations: ${error}`)
    }
    throw error
  }
}

async function pushLocalTranslations(
  config: RemoteConfig,
  translations: Record<string, any>,
): Promise<void> {
  consola.info(`Pushing translations to ${config.type} remote...`)

  const apiPath = config.path || 'translations'
  const axiosInstance = await createAxiosInstance(config)

  try {
    switch (config.type) {
      case 'github': {
        // Получаем текущий SHA файлов для обновления
        const apiUrl = `/repos${new URL(config.url).pathname}/contents/${apiPath}`
        const { data: files } = await axiosInstance.get(apiUrl)

        if (!Array.isArray(files)) {
          throw new TypeError('Invalid response from GitHub API')
        }

        // Обновляем каждый файл
        for (const [locale, content] of Object.entries(translations)) {
          const fileName = `${locale}.json`
          const file = files.find((f: any) => f.name === fileName)
          const fileContent = JSON.stringify(content, null, 2)
          const encodedContent = Buffer.from(fileContent).toString('base64')

          try {
            await axiosInstance.put(`${apiUrl}/${fileName}`, {
              message: `Update ${fileName} translations`,
              content: encodedContent,
              sha: file?.sha,
              branch: config.branch || 'main',
            })
            consola.success(`Updated ${fileName}`)
          }
          catch (error) {
            if (axios.isAxiosError(error)) {
              consola.warn(`Failed to update ${fileName}: ${error.response?.statusText || error.message}`)
            }
            continue
          }
        }
        break
      }

      case 'gitlab': {
        const projectPath = encodeURIComponent(new URL(config.url).pathname.slice(1))

        // Для GitLab используем API для создания/обновления файлов
        for (const [locale, content] of Object.entries(translations)) {
          const fileName = `${locale}.json`
          const filePath = `${apiPath}/${fileName}`
          const fileContent = JSON.stringify(content, null, 2)
          const encodedContent = Buffer.from(fileContent).toString('base64')
          const apiUrl = `/api/v4/projects/${projectPath}/repository/files/${encodeURIComponent(filePath)}`

          try {
            await axiosInstance.put(apiUrl, {
              branch: config.branch || 'main',
              content: encodedContent,
              commit_message: `Update ${fileName} translations`,
            })
            consola.success(`Updated ${fileName}`)
          }
          catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
              // Если файл не существует, пробуем создать его
              try {
                await axiosInstance.post(apiUrl, {
                  branch: config.branch || 'main',
                  content: encodedContent,
                  commit_message: `Add ${fileName} translations`,
                })
                consola.success(`Created ${fileName}`)
              }
              catch (createError) {
                if (axios.isAxiosError(createError)) {
                  consola.warn(`Failed to create ${fileName}: ${createError.response?.statusText || createError.message}`)
                }
                continue
              }
            }
            else if (axios.isAxiosError(error)) {
              consola.warn(`Failed to update ${fileName}: ${error.response?.statusText || error.message}`)
            }
            continue
          }
        }
        break
      }

      case 'custom': {
        // Для кастомного хранилища отправляем все переводы одним запросом
        await axiosInstance.put(`/${apiPath}`, translations)
        consola.success('Successfully pushed all translations')
        break
      }
    }
  }
  catch (error) {
    if (axios.isAxiosError(error)) {
      consola.error(`Failed to push translations: ${error.response?.statusText || error.message}`)
    }
    else {
      consola.error(`Failed to push translations: ${error}`)
    }
    throw error
  }
}

async function resolveConflicts(
  localTranslations: Record<string, any>,
  remoteTranslations: Record<string, any>,
  options: SyncOptions,
): Promise<Record<string, any>> {
  const flatLocal = flattenTranslations(localTranslations)
  const flatRemote = flattenTranslations(remoteTranslations)
  const conflicts: Array<{ key: string, local: any, remote: any }> = []

  // Находим конфликты
  for (const [key, remoteValue] of Object.entries(flatRemote)) {
    const localValue = flatLocal[key]
    if (localValue !== undefined && localValue !== remoteValue) {
      conflicts.push({ key, local: localValue, remote: remoteValue })
    }
  }

  if (conflicts.length > 0) {
    consola.warn(`Found ${conflicts.length} conflicts:`)
    for (const conflict of conflicts) {
      consola.warn(`  ${conflict.key}:`)
      consola.warn(`    Local:  ${JSON.stringify(conflict.local)}`)
      consola.warn(`    Remote: ${JSON.stringify(conflict.remote)}`)
    }

    if (options.force) {
      consola.info('Using remote values (force mode)')
      return remoteTranslations
    }
    else if (options.dryRun) {
      consola.info('Dry run mode - keeping local values')
      return localTranslations
    }
    else {
      // В реальном приложении здесь можно добавить интерактивное разрешение конфликтов
      throw new Error('Conflicts found. Use --force to overwrite local changes or resolve conflicts manually')
    }
  }

  return { ...localTranslations, ...remoteTranslations }
}

export default defineCommand({
  meta: {
    name: 'sync-remote',
    description: 'Synchronize translations with remote storage',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing translation files',
    },
    pull: {
      type: 'boolean',
      description: 'Pull translations from remote storage',
      default: true,
    },
    push: {
      type: 'boolean',
      description: 'Push translations to remote storage',
      default: false,
    },
    force: {
      type: 'boolean',
      description: 'Force synchronization (overwrite local changes)',
      default: false,
    },
    dryRun: {
      type: 'boolean',
      description: 'Perform a dry run without making changes',
      default: false,
    },
  },
  async run({ args }: { args: SyncRemoteArgs }) {
    const cwd = resolve((args.cwd || '.').toString())
    const { locales, translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)
    const translationDir = args.translationDir || defaultTranslationDir

    if (!fs.existsSync(translationDir)) {
      throw new Error('Translation directory does not exist')
    }

    const options: SyncOptions = {
      pull: args.pull ?? true,
      push: args.push ?? false,
      force: args.force ?? false,
      dryRun: args.dryRun ?? false,
    }

    // Загружаем конфигурацию удаленного хранилища
    const remoteConfig = await loadRemoteConfig(cwd)
    await validateRemoteConfig(remoteConfig)

    const result: SyncResult = {
      added: [],
      updated: [],
      deleted: [],
      conflicts: [],
      errors: [],
    }

    // Загружаем локальные переводы
    const localTranslations: Record<string, any> = {}
    for (const locale of locales) {
      const filePath = path.join(translationDir, `${locale.code}.json`)
      if (fs.existsSync(filePath)) {
        try {
          localTranslations[locale.code] = loadJsonFile(filePath) || {}
        }
        catch (error) {
          result.errors.push({ file: filePath, error: String(error) })
        }
      }
    }

    if (options.pull) {
      // Загружаем удаленные переводы
      const remoteTranslations = await fetchRemoteTranslations(remoteConfig)

      // Разрешаем конфликты
      const mergedTranslations = await resolveConflicts(
        localTranslations,
        remoteTranslations,
        options,
      )

      // Сохраняем объединенные переводы
      if (!options.dryRun) {
        for (const [locale, translations] of Object.entries(mergedTranslations)) {
          const filePath = path.join(translationDir, `${locale}.json`)
          try {
            saveJsonFile(filePath, translations)
            if (!localTranslations[locale]) {
              result.added.push(locale)
            }
            else {
              result.updated.push(locale)
            }
          }
          catch (error) {
            result.errors.push({ file: filePath, error: String(error) })
          }
        }
      }
    }

    if (options.push) {
      // Отправляем локальные переводы в удаленное хранилище
      await pushLocalTranslations(remoteConfig, localTranslations)
    }

    // Выводим результаты
    if (options.dryRun) {
      consola.info('Dry run completed. No changes were made.')
    }
    else {
      if (result.added.length > 0) {
        consola.success(`Added ${result.added.length} new locales: ${result.added.join(', ')}`)
      }
      if (result.updated.length > 0) {
        consola.success(`Updated ${result.updated.length} locales: ${result.updated.join(', ')}`)
      }
      if (result.deleted.length > 0) {
        consola.warn(`Deleted ${result.deleted.length} locales: ${result.deleted.join(', ')}`)
      }
      if (result.conflicts.length > 0) {
        consola.warn(`Found ${result.conflicts.length} conflicts`)
      }
      if (result.errors.length > 0) {
        consola.error(`Encountered ${result.errors.length} errors:`)
        for (const error of result.errors) {
          consola.error(`  ${error.file}: ${error.error}`)
        }
      }
    }
  },
})
