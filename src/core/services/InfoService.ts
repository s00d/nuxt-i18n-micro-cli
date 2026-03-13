import os from 'node:os'
import { execSync } from 'node:child_process'
import { relative, resolve } from 'pathe'
import { asRecord, isJsonObject } from '../types'
import { collectFilesRecursive, pathExists } from '../utils/dir'
import { getFileMetadata } from '../utils/file'
import { loadJsonFile } from '../utils/json'
import { normalizePageScope } from '../utils/page-file'
import { formatBytes } from '../utils/size'
import { getLocaleCodeFromLocaleFilePath } from '../utils/translation-paths'

interface FormattedFileStats {
  count: number
  size: string
}

interface RawFileStats {
  count: number
  size: number
}

interface RawTranslationStats {
  totalFiles: number
  totalSize: number
  filesByLocale: Record<string, RawFileStats>
  largestFile: { name: string, size: number }
  lastModified: Date
}

interface I18nConfig {
  locales: Array<{ code: string }>
  translationDir: string
  defaultLocale: string
}

interface PackageManifest {
  name?: string
  version?: string
  description?: string
  repository?: unknown
  license?: string
  dependencies?: Record<string, unknown>
  devDependencies?: Record<string, unknown>
  peerDependencies?: Record<string, unknown>
  optionalDependencies?: Record<string, unknown>
  engines?: unknown
  packageManager?: string
}

function getLocalPackageInfo(cwd: string) {
  try {
    const localPkgPath = resolve(cwd, 'package.json')
    if (pathExists(localPkgPath)) {
      const loaded = loadJsonFile(localPkgPath)
      if (!isJsonObject(loaded)) {
        return null
      }
      const localPkg = loaded
      return {
        name: localPkg.name,
        version: localPkg.version,
        dependencies: asRecord(localPkg.dependencies),
        devDependencies: asRecord(localPkg.devDependencies),
        peerDependencies: asRecord(localPkg.peerDependencies),
        optionalDependencies: asRecord(localPkg.optionalDependencies),
        engines: localPkg.engines,
        packageManager: localPkg.packageManager,
      }
    }
  }
  catch {
    return null
  }
  return null
}

function getTranslationStats(config: I18nConfig) {
  const stats: RawTranslationStats = {
    totalFiles: 0,
    totalSize: 0,
    filesByLocale: {},
    largestFile: { name: '', size: 0 },
    lastModified: new Date(0),
  }

  const dir = config.translationDir
  if (!pathExists(dir)) {
    return stats
  }

  for (const locale of config.locales) {
    const filePath = resolve(dir, `${locale.code}.json`)
    if (pathExists(filePath)) {
      const fileMeta = getFileMetadata(filePath)
      updateTranslationStats(stats, locale.code, fileMeta.size, fileMeta.modifiedAt, `${locale.code}.json`)
    }
  }

  const pagesDir = resolve(dir, 'pages')
  if (pathExists(pagesDir)) {
    const localeCodeSet = new Set(config.locales.map(locale => locale.code))
    const pageFiles = collectFilesRecursive(
      pagesDir,
      (_fullPath, entry) => entry.name.endsWith('.json'),
    )

    for (const filePath of pageFiles) {
      const localeCode = getLocaleCodeFromLocaleFilePath(filePath)
      if (!localeCodeSet.has(localeCode)) {
        continue
      }

      const fileMeta = getFileMetadata(filePath)
      const displayName = `pages/${normalizePageScope(relative(pagesDir, filePath))}`
      updateTranslationStats(stats, localeCode, fileMeta.size, fileMeta.modifiedAt, displayName)
    }
  }

  return stats
}

function updateTranslationStats(
  stats: RawTranslationStats,
  localeCode: string,
  size: number,
  modifiedAt: Date,
  displayName: string,
): void {
  stats.totalFiles++
  stats.totalSize += size
  const localeStats = stats.filesByLocale[localeCode] ?? { count: 0, size: 0 }
  stats.filesByLocale[localeCode] = {
    count: localeStats.count + 1,
    size: localeStats.size + size,
  }
  stats.lastModified = new Date(Math.max(stats.lastModified.getTime(), modifiedAt.getTime()))
  if (size > stats.largestFile.size) {
    stats.largestFile = { name: displayName, size }
  }
}

function getGitInfo(cwd: string) {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd }).toString().trim()
    const commit = execSync('git rev-parse HEAD', { cwd }).toString().trim()
    const lastCommit = execSync('git log -1 --format="%h - %s (%cr)"', { cwd }).toString().trim()
    return { branch, commit, lastCommit }
  }
  catch {
    return null
  }
}

function getMemoryInfo() {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  return {
    total: formatBytes(total),
    free: formatBytes(free),
    used: formatBytes(used),
    usagePercent: ((used / total) * 100).toFixed(1),
  }
}

function formatFilesByLocale(
  filesByLocale: Record<string, RawFileStats>,
): Record<string, FormattedFileStats> {
  const formatted: Record<string, FormattedFileStats> = {}
  for (const [locale, stats] of Object.entries(filesByLocale)) {
    formatted[locale] = {
      count: stats.count,
      size: formatBytes(stats.size),
    }
  }
  return formatted
}

export function buildInfoSnapshot(params: {
  cwd: string
  config: I18nConfig
  cliPackage: PackageManifest
  debug: boolean
}) {
  const translationStats = getTranslationStats(params.config)
  const memoryInfo = getMemoryInfo()
  const gitInfo = getGitInfo(params.cwd)
  const localPackageInfo = getLocalPackageInfo(params.cwd)

  return {
    cli: {
      name: params.cliPackage.name,
      version: params.cliPackage.version,
      description: params.cliPackage.description,
      repository: params.cliPackage.repository,
      license: params.cliPackage.license,
      dependencies: Object.keys(params.cliPackage.dependencies || {}).length,
      devDependencies: Object.keys(params.cliPackage.devDependencies || {}).length,
      engines: params.cliPackage.engines,
      packageManager: params.cliPackage.packageManager,
    },
    project: {
      cwd: params.cwd,
      package: localPackageInfo,
      locales: params.config.locales.map(locale => ({
        code: locale.code,
        file: `${locale.code}.json`,
      })),
      defaultLocale: params.config.defaultLocale,
      translationDir: params.config.translationDir,
      totalLocales: params.config.locales.length,
      translationStats: {
        totalFiles: translationStats.totalFiles,
        totalSize: formatBytes(translationStats.totalSize),
        filesByLocale: formatFilesByLocale(translationStats.filesByLocale),
        largestFile: {
          name: translationStats.largestFile.name,
          size: formatBytes(translationStats.largestFile.size),
        },
        lastModified: translationStats.lastModified.toISOString(),
      },
      git: gitInfo,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: os.cpus().length,
      memory: memoryInfo,
      uptime: os.uptime(),
      hostname: os.hostname(),
      user: os.userInfo().username,
      shell: process.env.SHELL,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PATH: process.env.PATH,
      },
    },
    debug: params.debug
      ? {
          process: {
            pid: process.pid,
            ppid: process.ppid,
            execPath: process.execPath,
            argv: process.argv,
            execArgv: process.execArgv,
            env: process.env,
          },
          os: {
            type: os.type(),
            release: os.release(),
            version: os.version(),
            homedir: os.homedir(),
            tmpdir: os.tmpdir(),
            endianness: os.endianness(),
            loadavg: os.loadavg(),
            networkInterfaces: os.networkInterfaces(),
          },
        }
      : undefined,
  }
}
