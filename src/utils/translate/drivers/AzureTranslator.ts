// src/utils/drivers/AzureTranslator.ts

import axios from 'axios';
import { TranslatorDriver } from './TranslatorDriver';

interface AzureTranslateResponseItem {
  translations: Array<{
    text: string;
    to: string;
  }>;
}

interface AzureTranslateError {
  error: {
    code: string;
    message: string;
  };
}

export class AzureTranslator implements TranslatorDriver {
  private apiKey: string;

  constructor(apiKey: string, _options?:  { [key: string]: string }) {
    this.apiKey = apiKey;
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: {
      profanityAction?: string;
      textType?: string;
    }
  ): Promise<string> {
    const endpoint = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';

    const params = new URLSearchParams({
      from: fromLang,
      to: toLang,
      ...options,
    });

    const url = `${endpoint}&${params.toString()}`;

    const body = [{ Text: text }];

    try {
      const response = await axios.post<AzureTranslateResponseItem[] | AzureTranslateError>(
        url,
        body,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (Array.isArray(data)) {
        const translatedText = data[0]?.translations[0]?.text;
        if (translatedText) {
          return translatedText;
        } else {
          throw new Error('Azure Translator API error: No translation found in response');
        }
      } else if ('error' in data) {
        throw new Error(`Azure Translator API error: ${data.error.message}`);
      } else {
        throw new Error('Azure Translator API error: Unknown response format');
      }
    } catch (error: any) {
      throw new Error(`Azure Translator API error: ${error.message}`);
    }
  }
}
