// src/utils/drivers/ReversoTranslator.ts

import axios from 'axios';
import { TranslatorDriver } from './TranslatorDriver';

interface ReversoTranslateResponse {
  translation: string[];
  // другие поля...
}

export class ReversoTranslator implements TranslatorDriver {
  private baseUrl: string;

  constructor(_apiKey: string, options?: { [key: string]: string }) {
    this.baseUrl = options?.baseUrl || 'https://api.reverso.net/translate/v1/translation';
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: { [key: string]: any }
  ): Promise<string> {
    const url = this.baseUrl;

    const data = {
      input: text,
      from: fromLang,
      to: toLang,
      format: 'text',
      options: {
        sentenceSplitter: false,
        origin: 'translation.web',
      },
    };

    try {
      const response = await axios.post<ReversoTranslateResponse>(url, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = response.data;

      if (!responseData.translation || responseData.translation.length === 0) {
        throw new Error('Reverso API error: No translation found in response');
      }

      return responseData.translation[0];
    } catch (error: any) {
      throw new Error(`Reverso API error: ${error.message}`);
    }
  }
}
