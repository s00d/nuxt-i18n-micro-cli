// src/utils/drivers/BaiduTranslator.ts

import axios from 'axios';
import * as crypto from 'crypto';
import { TranslatorDriver } from './TranslatorDriver';

interface BaiduTranslateResponse {
  trans_result: Array<{
    src: string;
    dst: string;
  }>;
  error_code?: string;
  error_msg?: string;
}

export class BaiduTranslator implements TranslatorDriver {
  private apiKey: string;
  private appId: string;

  constructor(apiKey: string, _options?:  { [key: string]: string }) {
    const [appId, key] = apiKey.split(':');
    if (!appId || !key) {
      throw new Error('Baidu Translator requires apiKey in the format "appId:apiKey".');
    }
    this.appId = appId;
    this.apiKey = key;
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: { salt?: string }
  ): Promise<string> {
    const salt = options?.salt || Date.now().toString();

    const sign = this.md5(`${this.appId}${text}${salt}${this.apiKey}`);

    const params = new URLSearchParams({
      q: text,
      from: fromLang,
      to: toLang,
      appid: this.appId,
      salt: salt,
      sign: sign,
    });

    const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?${params.toString()}`;

    try {
      const response = await axios.get<BaiduTranslateResponse>(url);
      const data = response.data;

      if (data.error_code) {
        throw new Error(`Baidu Translate API error: ${data.error_msg} (${data.error_code})`);
      }

      return data.trans_result[0].dst;
    } catch (error: any) {
      throw new Error(`Baidu Translate API error: ${error.message}`);
    }
  }

  private md5(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
  }
}
