// src/utils/drivers/ModernMTTranslator.ts

import axios from 'axios';
import { TranslatorDriver } from './TranslatorDriver';

interface ModernMTTranslateResponse {
  data: {
    translation: string;
  };
  error?: {
    type: string;
    message: string;
  };
}

export class ModernMTTranslator implements TranslatorDriver {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, options?: { [key: string]: string }) {
    if (!apiKey) {
      throw new Error('ModernMT Translator requires an apiKey.');
    }
    this.apiKey = apiKey;
    this.baseUrl = options?.baseUrl || 'https://api.modernmt.com';
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: { context?: string }
  ): Promise<string> {
    const url = `${this.baseUrl}/translate`;

    const params = {
      q: text,
      source: fromLang,
      target: toLang,
      context: options?.context,
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `ApiKey ${this.apiKey}`,
    };

    try {
      const response = await axios.post<ModernMTTranslateResponse>(url, params, { headers });

      const data = response.data;

      if (data.error) {
        throw new Error(`ModernMT API error: ${data.error.message} (${data.error.type})`);
      }

      return data.data.translation;
    } catch (error: any) {
      throw new Error(`ModernMT API error: ${error.message}`);
    }
  }
}
