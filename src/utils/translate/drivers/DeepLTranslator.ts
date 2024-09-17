// src/utils/drivers/DeepLTranslator.ts

import axios from 'axios';
import { TranslatorDriver } from './TranslatorDriver';

interface DeepLTranslateResponse {
  translations: Array<{
    detected_source_language?: string;
    text: string;
  }>;
  message?: string;
}

export class DeepLTranslator implements TranslatorDriver {
  private apiKey: string;

  constructor(apiKey: string, _options?:  { [key: string]: string }) {
    this.apiKey = apiKey;
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: {
      formality?: string;
      glossary_id?: string;
    }
  ): Promise<string> {
    const url = 'https://api.deepl.com/v2/translate';

    const params: { [key: string]: any } = {
      auth_key: this.apiKey,
      text: text,
      target_lang: toLang.toUpperCase(),
      ...options, // Включаем дополнительные опции
    };

    if (fromLang) {
      params['source_lang'] = fromLang.toUpperCase();
    }

    try {
      const response = await axios.post<DeepLTranslateResponse>(
        url,
        new URLSearchParams(params).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      const data = response.data;

      if ('message' in data) {
        throw new Error(`DeepL API error: ${data.message}`);
      }

      return data.translations[0].text;
    } catch (error: any) {
      throw new Error(`DeepL API error: ${error.message}`);
    }
  }
}
