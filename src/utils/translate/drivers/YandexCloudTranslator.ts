// src/utils/drivers/YandexCloudTranslator.ts

import axios from 'axios';
import { TranslatorDriver } from './TranslatorDriver';

interface YandexTranslateResponse {
  translations: Array<{
    text: string;
  }>;
}

export class YandexCloudTranslator implements TranslatorDriver {
  private apiKey: string;
  private folderId: string;

  constructor(apiKey: string, options?: { [key: string]: string }) {
    this.apiKey = apiKey;
    this.folderId = options?.folderId || '';
    if (!this.folderId) {
      throw new Error('Yandex Cloud Translator requires folderId in options.');
    }
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: { [key: string]: any }
  ): Promise<string> {
    const url = 'https://translate.api.cloud.yandex.net/translate/v2/translate';

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Api-Key ${this.apiKey}`,
    };

    const body = {
      folderId: this.folderId,
      texts: [text],
      sourceLanguageCode: fromLang,
      targetLanguageCode: toLang,
    };

    try {
      const response = await axios.post<YandexTranslateResponse>(url, body, { headers });
      const data = response.data;

      return data.translations[0].text;
    } catch (error: any) {
      throw new Error(`Yandex Cloud Translate API error: ${error.message}`);
    }
  }
}
