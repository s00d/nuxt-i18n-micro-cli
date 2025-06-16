import fs from 'node:fs'
import path from 'node:path'
import { resolve } from 'pathe'
import type { CommandDef, CommandMeta } from 'citty'
import glob from 'glob'

interface CommandWithMeta extends CommandDef {
  meta: CommandMeta
}

async function generateDocs() {
  const commandsDir = resolve(process.cwd(), 'src/commands')
  const outputFile = resolve(process.cwd(), 'docs/cli.md')

  // Get list of command files
  const commandFiles = glob.sync('*.ts', {
    cwd: commandsDir,
    ignore: ['index.ts', '_shared.ts', '.DS_Store'],
  })

  const commands: Record<string, CommandWithMeta> = {}

  // Import and collect commands
  for (const file of commandFiles) {
    try {
      const module = await import(path.join(commandsDir, file))
      const command = module.default as CommandWithMeta
      if (command?.meta?.name) {
        commands[command.meta.name] = command
      }
    }
    catch (error) {
      console.error(`Error importing command from file ${file}:`, error)
    }
  }

  let markdown = `---
outline: deep
---

# 🌐 nuxt-i18n-micro-cli Guide

## 📖 Introduction

\`nuxt-i18n-micro-cli\` is a command-line tool designed to streamline the localization and internationalization process in Nuxt.js projects using the \`nuxt-i18n\` module. It provides utilities to extract translation keys from your codebase, manage translation files, synchronize translations across locales, and automate the translation process using external translation services.

This guide will walk you through installing, configuring, and using \`nuxt-i18n-micro-cli\` to effectively manage your project's translations. Package on [npmjs.com](https://www.npmjs.com/package/nuxt-i18n-micro-cli).

## 🔧 Installation and Setup

### 📦 Installing nuxt-i18n-micro-cli

Install \`nuxt-i18n-micro-cli\` globally using npm:

\`\`\`bash
npm install -g nuxt-i18n-micro-cli
\`\`\`

This will make the \`i18n-micro\` command available globally on your system.

### 🛠 Initializing in Your Project

After installing, you can run \`i18n-micro\` commands in your Nuxt.js project directory.

Ensure that your project is set up with \`nuxt-i18n\` and has the necessary configuration in \`nuxt.config.js\`.

### 📄 Common Arguments

- \`--cwd\`: Specify the current working directory (defaults to \`.\`).
- \`--logLevel\`: Set the log level (\`silent\`, \`info\`, \`verbose\`).
- \`--translationDir\`: Directory containing JSON translation files (default: \`locales\`).

## 📋 Commands\n\n`

  // Sort commands alphabetically
  const sortedCommands = Object.entries(commands).sort(([a], [b]) => a.localeCompare(b))

  for (const [name, command] of sortedCommands) {
    const { meta } = command
    if (!meta) continue

    // Command header with emoji
    const emoji = getCommandEmoji(name)
    markdown += `### ${emoji} \`${meta.name}\` Command\n\n`

    // Add version if available
    if ('version' in meta) {
      markdown += `**Version introduced**: \`${meta.version}\`\n\n`
    }

    // Add description
    markdown += `**Description**: ${meta.description}\n\n`

    // Add usage
    markdown += `**Usage**:\n\n`
    markdown += `\`\`\`bash\ni18n-micro ${meta.name} [options]\n\`\`\`\n\n`

    // Add options
    const args = command.args
    if (args && Object.keys(args).length > 0) {
      markdown += `**Options**:\n\n`
      for (const [argName, arg] of Object.entries(args)) {
        const defaultValue = arg.default !== undefined ? ` (default: \`${JSON.stringify(arg.default)}\`)` : ''
        // const type = Array.isArray(arg.type) ? arg.type.join(' | ') : arg.type
        markdown += `- \`--${argName}\`: ${arg.description}${defaultValue}\n`
      }
      markdown += '\n'
    }

    // Add examples if available
    if ('examples' in meta && Array.isArray(meta.examples) && meta.examples.length > 0) {
      markdown += `**Example**:\n\n`
      for (const example of meta.examples) {
        markdown += `\`\`\`bash\n${example}\n\`\`\`\n\n`
      }
    }

    // Add notes if available
    if ('notes' in meta && meta.notes) {
      markdown += `**Notes**:\n\n${meta.notes}\n\n`
    }

    // Add how it works if available
    if ('howItWorks' in meta && meta.howItWorks) {
      markdown += `**How it works**:\n\n${meta.howItWorks}\n\n`
    }

    // Add best practices if available
    if ('bestPractices' in meta && meta.bestPractices) {
      markdown += `**Best Practices**:\n\n${meta.bestPractices}\n\n`
    }

    markdown += `---\n\n`
  }

  // Create docs directory if it doesn't exist
  const docsDir = path.dirname(outputFile)
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  // Write documentation to file
  fs.writeFileSync(outputFile, markdown, 'utf-8')
  console.log(`Documentation generated: ${outputFile}`)
}

// Helper function to get emoji for command
function getCommandEmoji(name: string): string {
  const emojiMap: Record<string, string> = {
    // Основные команды
    'text-to-i18n': '🔄',
    'translate': '🌍',
    'sync': '🔄',
    'sync-remote': '🌐',
    'extract': '🛠️',
    'stats': '📊',
    'validate': '✅',
    'optimize': '⚡',
    'lint': '🔍',

    // Импорт/Экспорт
    'import': '📥',
    'import-csv': '📊',
    'export': '📤',
    'export-csv': '📊',

    // Управление файлами
    'backup': '💾',
    'restore': '🔄',
    'clean': '🧹',
    'format': '✨',
    'diff': '📝',
    'info': 'ℹ️',
    'split': '✂️',
    'replace-values': '🔄',

    // Анализ и проверка
    'check-duplicates': '🔍',

    // Дополнительные команды
    'merge': '🔄',
    'convert': '🔄',
    'sort': '↕️',
    'search': '🔎',
    'compare': '🔄',
    'migrate': '🔄',
    'generate': '⚙️',
    'test': '🧪',
    'verify': '✅',
    'update': '🔄',
    'init': '🚀',
    'config': '⚙️',
    'help': '❓',
    'version': '📌',
  }

  return emojiMap[name] || '📋'
}

generateDocs().catch(console.error)
