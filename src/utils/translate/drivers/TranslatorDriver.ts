// src/utils/drivers/TranslatorDriver.ts

export interface TranslatorDriver {
  translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: { [key: string]: any }
  ): Promise<string>;
}
