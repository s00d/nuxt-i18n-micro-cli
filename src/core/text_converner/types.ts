export interface TranslationEntry {
  key: string
  value: string
  file?: string
  line?: number
}

export interface ProcessingOptions {
  dryRun?: boolean
  verbose?: boolean
  context?: string
  extractOnlyDirectories?: string[]
  extractOnlyPatterns?: string[]
  baseDir?: string
  keyOverrides?: Record<string, string>
  skippedKeys?: string[]
}

export interface ProcessorContext {
  getOrCreateTranslationKey(text: string, filePath: string, lines: string[]): string | null
}
