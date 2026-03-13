export type TranslateOptions = Record<string, unknown>

export interface TranslatorDriver {
  translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: TranslateOptions
  ): Promise<string>
  translateBatch?(
    texts: string[],
    fromLang: string,
    toLang: string,
    options?: TranslateOptions
  ): Promise<string[]>
}
