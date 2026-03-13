export class I18nError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'I18nError'
  }
}
