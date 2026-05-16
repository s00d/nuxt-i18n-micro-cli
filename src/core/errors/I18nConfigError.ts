import { CliError } from './CliError'

export type I18nConfigErrorCode
  = | 'NOT_NUXT_PROJECT'
    | 'NUXT_LOAD_FAILED'
    | 'I18N_MODULE_MISSING'
    | 'I18N_NOT_CONFIGURED'
    | 'NO_LOCALES'
    | 'NO_TRANSLATION_DIR'

export class I18nConfigError extends CliError {
  readonly cwd: string
  readonly nuxtRoot?: string

  constructor(options: {
    code: I18nConfigErrorCode
    message: string
    cwd: string
    nuxtRoot?: string
    hints?: string[]
    cause?: unknown
  }) {
    const details: Record<string, string> = {
      'Working directory': options.cwd,
    }
    if (options.nuxtRoot && options.nuxtRoot !== options.cwd) {
      details['Nuxt project root'] = options.nuxtRoot
    }

    super({
      code: options.code,
      message: options.message,
      hints: options.hints,
      details,
      cause: options.cause,
    })
    this.name = 'I18nConfigError'
    this.cwd = options.cwd
    this.nuxtRoot = options.nuxtRoot
  }
}

export function isI18nConfigError(error: unknown): error is I18nConfigError {
  return error instanceof I18nConfigError
}
