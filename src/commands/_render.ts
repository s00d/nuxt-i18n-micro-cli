import { consola } from 'consola'
import boxen from 'boxen'
import chalk from 'chalk'
import logSymbols from 'log-symbols'
import { table } from 'table'

type StatusType = 'info' | 'success' | 'warn' | 'error'

const STATUS_SYMBOLS: Record<StatusType, string> = {
  info: logSymbols.info,
  success: logSymbols.success,
  warn: logSymbols.warning,
  error: logSymbols.error,
}

function isPrettyOutputEnabled(): boolean {
  return Boolean(process.stdout.isTTY)
}

export function renderSection(title: string): void {
  if (!isPrettyOutputEnabled()) {
    consola.info(`\n== ${title} ==`)
    return
  }

  console.log(boxen(chalk.bold(title), {
    padding: { left: 1, right: 1, top: 0, bottom: 0 },
    borderStyle: 'round',
    borderColor: 'gray',
  }))
}

export function renderStatus(type: StatusType, message: string): void {
  const symbol = STATUS_SYMBOLS[type]
  const colored = isPrettyOutputEnabled()
    ? colorByType(type)(`${symbol} ${message}`)
    : `${symbol} ${message}`

  if (type === 'success') {
    consola.success(colored)
    return
  }
  if (type === 'warn') {
    consola.warn(colored)
    return
  }
  if (type === 'error') {
    consola.error(colored)
    return
  }
  consola.info(colored)
}

export function renderKeyValueTable(rows: Array<[label: string, value: string | number]>): void {
  if (rows.length === 0) {
    return
  }

  if (!isPrettyOutputEnabled()) {
    for (const [label, value] of rows) {
      consola.info(`${label}: ${value}`)
    }
    return
  }

  const output = table([
    [chalk.bold('Metric'), chalk.bold('Value')],
    ...rows.map(([label, value]) => [label, String(value)]),
  ], {
    columns: {
      0: { alignment: 'left' },
      1: { alignment: 'right' },
    },
  })

  console.log(output)
}

export function renderList(title: string, items: string[]): void {
  if (items.length === 0) {
    return
  }

  consola.info(`\n${title}:`)
  for (const item of items) {
    consola.info(`  - ${item}`)
  }
}

function colorByType(type: StatusType): (text: string) => string {
  switch (type) {
    case 'success':
      return chalk.green
    case 'warn':
      return chalk.yellow
    case 'error':
      return chalk.red
    default:
      return chalk.cyan
  }
}
