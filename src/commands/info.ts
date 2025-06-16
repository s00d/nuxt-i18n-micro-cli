import fs from 'node:fs'
import os from 'node:os'
import { execSync } from 'node:child_process'
import { defineCommand } from 'citty'
import consola from 'consola'
import { resolve } from 'pathe'
import pPkg from '../../package.json' with { type: 'json' }
import { getI18nConfig } from '../utils/kit'
import { loadJsonFile } from '../utils/json'
import { sharedArgs } from './_shared'

interface FormattedFileStats {
  count: number
  size: string
}

export default defineCommand({
  meta: {
    name: 'info',
    description: 'Display detailed information about the CLI, project configuration, and system environment',
  },
  args: {
    ...sharedArgs,
    json: {
      type: 'boolean',
      description: 'Output information in JSON format',
      default: false,
    },
    debug: {
      type: 'boolean',
      description: 'Show additional debug information',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = args.cwd || process.cwd()
    const config = await getI18nConfig(cwd, args.logLevel)

    // Get local package.json if exists
    const getLocalPackageInfo = () => {
      try {
        const localPkgPath = resolve(cwd, 'package.json')
        if (fs.existsSync(localPkgPath)) {
          const localPkg = loadJsonFile(localPkgPath)
          return {
            name: localPkg.name,
            version: localPkg.version,
            dependencies: localPkg.dependencies || {},
            devDependencies: localPkg.devDependencies || {},
            peerDependencies: localPkg.peerDependencies || {},
            optionalDependencies: localPkg.optionalDependencies || {},
            engines: localPkg.engines,
            packageManager: localPkg.packageManager,
          }
        }
      }
      catch (error) {
        consola.error('Error reading local package.json:', error)
      }
      return null
    }

    // Get translation file stats
    const getTranslationStats = (dir: string) => {
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        filesByLocale: {} as Record<string, { count: number, size: number }>,
        largestFile: { name: '', size: 0 },
        lastModified: new Date(0),
      }

      try {
        if (fs.existsSync(dir)) {
          // Global translations
          for (const locale of config?.locales || []) {
            const filePath = resolve(dir, `${locale.code}.json`)
            if (fs.existsSync(filePath)) {
              const fileStat = fs.statSync(filePath)
              const size = fileStat.size
              stats.totalFiles++
              stats.totalSize += size
              stats.filesByLocale[locale.code] = { count: 1, size }
              stats.lastModified = new Date(Math.max(stats.lastModified.getTime(), fileStat.mtime.getTime()))

              if (size > stats.largestFile.size) {
                stats.largestFile = { name: `${locale.code}.json`, size }
              }
            }
          }

          // Page translations
          const pagesDir = resolve(dir, 'pages')
          if (fs.existsSync(pagesDir)) {
            for (const locale of config?.locales || []) {
              const localeDir = resolve(pagesDir, locale.code)
              if (fs.existsSync(localeDir)) {
                const files = fs.readdirSync(localeDir)
                let localeSize = 0
                let localeCount = 0

                for (const file of files) {
                  if (file.endsWith('.json')) {
                    const filePath = resolve(localeDir, file)
                    const fileStat = fs.statSync(filePath)
                    const size = fileStat.size
                    stats.totalFiles++
                    stats.totalSize += size
                    localeSize += size
                    localeCount++
                    stats.lastModified = new Date(Math.max(stats.lastModified.getTime(), fileStat.mtime.getTime()))

                    if (size > stats.largestFile.size) {
                      stats.largestFile = { name: `pages/${locale.code}/${file}`, size }
                    }
                  }
                }

                if (localeCount > 0) {
                  stats.filesByLocale[locale.code] = {
                    count: (stats.filesByLocale[locale.code]?.count || 0) + localeCount,
                    size: (stats.filesByLocale[locale.code]?.size || 0) + localeSize,
                  }
                }
              }
            }
          }
        }
      }
      catch (error) {
        consola.error('Error getting translation stats:', error)
      }

      return stats
    }

    // Get system memory info
    const getMemoryInfo = () => {
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

    // Format bytes to human readable format
    const formatBytes = (bytes: number) => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let size = bytes
      let unitIndex = 0
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
      }
      return `${size.toFixed(1)} ${units[unitIndex]}`
    }

    // Get git info if available
    const getGitInfo = () => {
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

    const translationStats = config ? getTranslationStats(config.translationDir) : null
    const memoryInfo = getMemoryInfo()
    const gitInfo = getGitInfo()
    const localPackageInfo = getLocalPackageInfo()

    const info = {
      cli: {
        name: pPkg.name,
        version: pPkg.version,
        description: pPkg.description,
        repository: pPkg.repository,
        license: pPkg.license,
        dependencies: Object.keys(pPkg.dependencies || {}).length,
        devDependencies: Object.keys(pPkg.devDependencies || {}).length,
        engines: pPkg.engines,
        packageManager: pPkg.packageManager,
      },
      project: {
        cwd,
        package: localPackageInfo,
        locales: config?.locales.map(locale => ({
          code: locale.code,
          file: `${locale.code}.json`,
        })) || [],
        defaultLocale: config?.defaultLocale,
        translationDir: config?.translationDir,
        totalLocales: config?.locales.length || 0,
        translationStats: translationStats
          ? {
              totalFiles: translationStats.totalFiles,
              totalSize: formatBytes(translationStats.totalSize),
              filesByLocale: Object.entries(translationStats.filesByLocale).reduce<Record<string, FormattedFileStats>>((acc, [locale, stats]) => ({
                ...acc,
                [locale]: {
                  count: stats.count,
                  size: formatBytes(stats.size),
                },
              }), {}),
              largestFile: {
                name: translationStats.largestFile.name,
                size: formatBytes(translationStats.largestFile.size),
              },
              lastModified: translationStats.lastModified.toISOString(),
            }
          : null,
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
      debug: args.debug
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

    if (args.json) {
      console.log(JSON.stringify(info, null, 2))
      return
    }

    // CLI Information
    consola.box('CLI Information')
    consola.info('Name:', info.cli.name)
    consola.info('Version:', info.cli.version)
    consola.info('Description:', info.cli.description)
    consola.info('Repository:', info.cli.repository)
    consola.info('License:', info.cli.license)
    consola.info('Dependencies:', info.cli.dependencies)
    consola.info('Dev Dependencies:', info.cli.devDependencies)
    consola.info('Engines:', info.cli.engines)
    consola.info('Package Manager:', info.cli.packageManager)

    // Project Information
    consola.box('Project Configuration')
    consola.info('Working Directory:', info.project.cwd)

    if (info.project.package) {
      consola.info('\nLocal Package:')
      consola.info('  Name:', info.project.package.name)
      consola.info('  Version:', info.project.package.version)
      consola.info('  Package Manager:', info.project.package.packageManager)
      consola.info('  Engines:', info.project.package.engines)

      if (Object.keys(info.project.package.dependencies).length > 0) {
        consola.info('\n  Dependencies:')
        Object.entries(info.project.package.dependencies).forEach(([name, version]) => {
          consola.info(`    - ${name}: ${version}`)
        })
      }

      if (Object.keys(info.project.package.devDependencies).length > 0) {
        consola.info('\n  Dev Dependencies:')
        Object.entries(info.project.package.devDependencies).forEach(([name, version]) => {
          consola.info(`    - ${name}: ${version}`)
        })
      }

      if (Object.keys(info.project.package.peerDependencies).length > 0) {
        consola.info('\n  Peer Dependencies:')
        Object.entries(info.project.package.peerDependencies).forEach(([name, version]) => {
          consola.info(`    - ${name}: ${version}`)
        })
      }

      if (Object.keys(info.project.package.optionalDependencies).length > 0) {
        consola.info('\n  Optional Dependencies:')
        Object.entries(info.project.package.optionalDependencies).forEach(([name, version]) => {
          consola.info(`    - ${name}: ${version}`)
        })
      }
    }

    if (config) {
      consola.info('\nTranslation Configuration:')
      consola.info('  Translation Directory:', info.project.translationDir)
      consola.info('  Default Locale:', info.project.defaultLocale)
      consola.info('  Total Locales:', info.project.totalLocales)

      consola.info('\n  Locales:')
      info.project.locales.forEach((locale) => {
        consola.info(`    - ${locale.code}`)
      })

      if (info.project.translationStats) {
        consola.info('\n  Translation Statistics:')
        consola.info('    Total Files:', info.project.translationStats.totalFiles)
        consola.info('    Total Size:', info.project.translationStats.totalSize)
        consola.info('    Largest File:', `${info.project.translationStats.largestFile.name} (${info.project.translationStats.largestFile.size})`)
        consola.info('    Last Modified:', info.project.translationStats.lastModified)

        consola.info('\n    Files by Locale:')
        Object.entries(info.project.translationStats.filesByLocale).forEach(([locale, stats]) => {
          consola.info(`      - ${locale}: ${stats.count} files, ${stats.size}`)
        })
      }

      if (info.project.git) {
        consola.info('\n  Git Information:')
        consola.info('    Branch:', info.project.git.branch)
        consola.info('    Commit:', info.project.git.commit)
        consola.info('    Last Commit:', info.project.git.lastCommit)
      }
    }
    else {
      consola.warn('No i18n configuration found in the project')
    }

    // System Information
    consola.box('System Information')
    consola.info('Node Version:', info.system.nodeVersion)
    consola.info('Platform:', info.system.platform)
    consola.info('Architecture:', info.system.arch)
    consola.info('CPUs:', info.system.cpus)
    consola.info('Memory:', `${info.system.memory.used} / ${info.system.memory.total} (${info.system.memory.usagePercent}% used)`)
    consola.info('Uptime:', `${Math.floor(info.system.uptime / 3600)}h ${Math.floor((info.system.uptime % 3600) / 60)}m`)
    consola.info('Hostname:', info.system.hostname)
    consola.info('User:', info.system.user)
    consola.info('Shell:', info.system.shell)
    consola.info('Environment:', info.system.env.NODE_ENV || 'development')

    if (args.debug) {
      consola.box('Debug Information')
      consola.info('Process ID:', info.debug?.process.pid)
      consola.info('Parent Process ID:', info.debug?.process.ppid)
      consola.info('Executable Path:', info.debug?.process.execPath)
      consola.info('OS Type:', info.debug?.os.type)
      consola.info('OS Release:', info.debug?.os.release)
      consola.info('OS Version:', info.debug?.os.version)
      consola.info('Home Directory:', info.debug?.os.homedir)
      consola.info('Temp Directory:', info.debug?.os.tmpdir)
      consola.info('System Load:', info.debug?.os.loadavg.join(', '))
    }
  },
})
