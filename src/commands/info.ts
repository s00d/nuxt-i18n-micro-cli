import { defineCommand } from 'citty'
import { consola } from 'consola'
import prettyMilliseconds from 'pretty-ms'
import { buildInfoSnapshot } from '../core/services/InfoService'
import { cliPackage } from '../package-meta'
import {
  printDependencyGroup,
  printInfoRows,
  printJson,
  resolveCommandContext,
  sharedArgs,
} from './_shared'
import { renderList, renderSection } from './_render'

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
    const { cwd, config } = await resolveCommandContext(args)
    const info = buildInfoSnapshot({
      cwd,
      config,
      cliPackage,
      debug: Boolean(args.debug),
    })

    if (args.json) {
      printJson(info)
      return
    }

    // CLI Information
    renderSection('CLI Information')
    printInfoRows([
      ['Name', info.cli.name],
      ['Version', info.cli.version],
      ['Description', info.cli.description],
      ['Repository', info.cli.repository],
      ['License', info.cli.license],
      ['Dependencies', info.cli.dependencies],
      ['Dev Dependencies', info.cli.devDependencies],
      ['Engines', info.cli.engines],
      ['Package Manager', info.cli.packageManager],
    ])

    // Project Information
    renderSection('Project Configuration')
    consola.info('Working Directory:', info.project.cwd)

    if (info.project.package) {
      consola.info('\nLocal Package:')
      printInfoRows([
        ['Name', info.project.package.name],
        ['Version', info.project.package.version],
        ['Package Manager', info.project.package.packageManager],
        ['Engines', info.project.package.engines],
      ], '  ')

      printDependencyGroup('Dependencies', info.project.package.dependencies)
      printDependencyGroup('Dev Dependencies', info.project.package.devDependencies)
      printDependencyGroup('Peer Dependencies', info.project.package.peerDependencies)
      printDependencyGroup('Optional Dependencies', info.project.package.optionalDependencies)
    }

    consola.info('\nTranslation Configuration:')
    printInfoRows([
      ['Translation Directory', info.project.translationDir],
      ['Default Locale', info.project.defaultLocale],
      ['Total Locales', info.project.totalLocales],
    ], '  ')

    renderList('Locales', info.project.locales.map(locale => locale.code))

    consola.info('\n  Translation Statistics:')
    printInfoRows([
      ['Total Files', info.project.translationStats.totalFiles],
      ['Total Size', info.project.translationStats.totalSize],
      ['Largest File', `${info.project.translationStats.largestFile.name} (${info.project.translationStats.largestFile.size})`],
      ['Last Modified', info.project.translationStats.lastModified],
    ], '    ')

    renderList(
      'Files by Locale',
      Object.entries(info.project.translationStats.filesByLocale).map(([locale, stats]) => `${locale}: ${stats.count} files, ${stats.size}`),
    )

    if (info.project.git) {
      consola.info('\n  Git Information:')
      printInfoRows([
        ['Branch', info.project.git.branch],
        ['Commit', info.project.git.commit],
        ['Last Commit', info.project.git.lastCommit],
      ], '    ')
    }

    // System Information
    renderSection('System Information')
    printInfoRows([
      ['Node Version', info.system.nodeVersion],
      ['Platform', info.system.platform],
      ['Architecture', info.system.arch],
      ['CPUs', info.system.cpus],
      ['Memory', `${info.system.memory.used} / ${info.system.memory.total} (${info.system.memory.usagePercent}% used)`],
      ['Uptime', prettyMilliseconds(info.system.uptime * 1000, { unitCount: 2 })],
      ['Hostname', info.system.hostname],
      ['User', info.system.user],
      ['Shell', info.system.shell],
      ['Environment', info.system.env.NODE_ENV || 'development'],
    ])

    if (args.debug) {
      renderSection('Debug Information')
      printInfoRows([
        ['Process ID', info.debug?.process.pid],
        ['Parent Process ID', info.debug?.process.ppid],
        ['Executable Path', info.debug?.process.execPath],
        ['OS Type', info.debug?.os.type],
        ['OS Release', info.debug?.os.release],
        ['OS Version', info.debug?.os.version],
        ['Home Directory', info.debug?.os.homedir],
        ['Temp Directory', info.debug?.os.tmpdir],
        ['System Load', info.debug?.os.loadavg.join(', ')],
      ])
    }
  },
})
