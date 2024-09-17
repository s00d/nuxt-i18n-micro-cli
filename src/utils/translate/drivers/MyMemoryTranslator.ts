// src/utils/drivers/MyMemoryTranslator.ts

import axios from 'axios';
import { TranslatorDriver } from './TranslatorDriver';

interface MyMemoryResponse {
  responseData: {
    translatedText: string;
  };
  responseStatus: number;
  responseDetails: string;
}

export class MyMemoryTranslator implements TranslatorDriver {
  private apiKey?: string;

  constructor(apiKey: string, _options?: { [key: string]: string }) {
    this.apiKey = apiKey;
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: { [key: string]: any }
  ): Promise<string> {
    const url = 'https://api.mymemory.translated.net/get';

    const params: { [key: string]: any } = {
      q: text,
      langpair: `${fromLang}|${toLang}`,
    };

    if (this.apiKey) {
      params['key'] = this.apiKey;
    }

    try {
      const response = await axios.get<MyMemoryResponse>(url, { params });

      const data = response.data;

      if (data.responseStatus !== 200) {
        throw new Error(`MyMemory API error: ${data.responseDetails}`);
      }

      return data.responseData.translatedText;
    } catch (error: any) {
      throw new Error(`MyMemory API error: ${error.message}`);
    }
  }
}
