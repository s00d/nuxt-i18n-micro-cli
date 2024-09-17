import type { TranslatorDriver } from './drivers/TranslatorDriver'
import translatorRegistry from './TranslatorRegistry'

export async function translateText(
  text: string,
  fromLang: string,
  toLang: string,
  service: string,
  apiKey: string,
  options?: { [key: string]: any },
): Promise<string> {
  const sourceLang = mapLanguageCode(service, fromLang)
  const targetLang = mapLanguageCode(service, toLang)

  const TranslatorClass = translatorRegistry[service.toLowerCase()]

  if (!TranslatorClass) {
    throw new Error(`Unsupported translation service: ${service}`)
  }

  // Некоторые переводчики не требуют apiKey
  const translator: TranslatorDriver = new TranslatorClass(apiKey, options)

  return translator.translate(text, sourceLang, targetLang, options)
}

const deeplLangMap: { [key: string]: string } = {
  'en': 'EN',
  'en-us': 'EN-US',
  'en-gb': 'EN-GB',
  'de': 'DE',
  'fr': 'FR',
  'es': 'ES',
  'it': 'IT',
  'nl': 'NL',
  'pl': 'PL',
  'pt': 'PT-PT',
  'pt-br': 'PT-BR',
  'ru': 'RU',
  'ja': 'JA',
  'zh': 'ZH',
  // Добавьте другие соответствия
}

function mapLanguageCode(service: string, lang: string): string {
  // Существующая реализация
  switch (service.toLowerCase()) {
    case 'deepl':
      // Маппинг языковых кодов для DeepL
      return deeplLangMap[lang.toLowerCase()] || lang.toUpperCase()
    default:
      return lang
  }
}
