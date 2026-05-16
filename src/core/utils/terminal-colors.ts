const ansi = {
  reset: '\u001B[0m',
  bold: (text: string) => `\u001B[1m${text}\u001B[22m`,
  dim: (text: string) => `\u001B[2m${text}\u001B[22m`,
  red: (text: string) => `\u001B[31m${text}\u001B[39m`,
  cyan: (text: string) => `\u001B[36m${text}\u001B[39m`,
  yellow: (text: string) => `\u001B[33m${text}\u001B[39m`,
}

export function supportsTerminalColors(
  stream: NodeJS.WriteStream = process.stdout,
): boolean {
  const forceColor = process.env.FORCE_COLOR
  if (forceColor !== undefined && forceColor !== '' && forceColor !== '0') {
    return true
  }

  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '') {
    return false
  }

  if (process.env.CI) {
    return true
  }

  return Boolean(stream.isTTY)
}

export function formatErrorHeadline(code: string, message: string): string {
  if (!supportsTerminalColors()) {
    return message
  }

  return `${ansi.dim(`[${code}]`)} ${ansi.bold(ansi.red(message))}`
}

export function formatErrorDetail(label: string, value: string): string {
  if (!supportsTerminalColors()) {
    return `${label}: ${value}`
  }

  return `${ansi.dim(`${label}:`)} ${ansi.cyan(value)}`
}

export function formatErrorHint(hint: string): string {
  if (!supportsTerminalColors()) {
    return hint
  }

  return `${ansi.yellow('→')} ${ansi.yellow(hint)}`
}

export function formatErrorStack(stack: string): string {
  if (!supportsTerminalColors()) {
    return stack
  }

  return ansi.dim(stack)
}
