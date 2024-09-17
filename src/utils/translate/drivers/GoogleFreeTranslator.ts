// src/utils/drivers/GoogleFreeTranslator.ts

import axios from 'axios';
import {TranslatorDriver} from './TranslatorDriver';
import consola from "consola";

export class GoogleFreeTranslator implements TranslatorDriver {
  constructor(_apiKey: string, _options?: { [key: string]: string }) {}

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: {
      proxy?: string;
      timeout?: number;
    }
  ): Promise<string> {
    const url = 'https://translate.google.com/translate_a/single';

    const params = {
      client: 'gtx',
      sl: fromLang,
      tl: toLang,
      hl: 'en',
      dt: 't',
      ie: 'UTF-8',
      oe: 'UTF-8',
      q: text,
      tk: this.generateToken(text),
    };

    const axiosOptions: { [key: string]: any } = {
      params,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
      },
      timeout: options?.timeout || 10000,
    };

    if (options?.proxy) {
      axiosOptions['proxy'] = {
        host: options.proxy,
      };
    }

    try {
      const response = await axios.get(url, axiosOptions);
      const data = response.data;

      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response from Google Translate');
      }

      // Извлекаем переведенный текст из ответа
      return data[0]
        .map((item: any) => (item[0] ? item[0] : ''))
        .join('');
    } catch (error: any) {
      consola.error(error)
      throw new Error(`Google Free Translate error: ${error.message}`);
    }
  }

  private generateToken(text: string): string {
    // Упрощенный алгоритм генерации токена
    const tkk = 0;

    const tokenTransform = (value: number, seed: string): number => {
      for (let d = 0; d < seed.length - 2; d += 3) {
        let c: number;
        const charCode = seed.charCodeAt(d + 2);
        if (charCode >= 97) {
          c = charCode - 87;
        } else {
          c = Number(seed.charAt(d + 2));
        }

        if (seed.charAt(d + 1) === '+') {
          c = value >>> c;
        } else {
          c = value << c;
        }

        if (seed.charAt(d) === '+') {
          value = (value + c) & 4294967295;
        } else {
          value = value ^ c;
        }
      }
      return value;
    };

    const e: number[] = [];
    for (let f = 0; f < text.length; f++) {
      let g = text.charCodeAt(f);
      if (g < 128) {
        e.push(g);
      } else {
        if (g < 2048) {
          e.push((g >> 6) | 192);
        } else {
          if (
            (g & 64512) === 55296 &&
            f + 1 < text.length &&
            (text.charCodeAt(f + 1) & 64512) === 56320
          ) {
            g =
              65536 +
              ((g & 1023) << 10) +
              (text.charCodeAt(++f) & 1023);
            e.push((g >> 18) | 240, ((g >> 12) & 63) | 128);
          } else {
            e.push((g >> 12) | 224);
          }
          e.push(((g >> 6) & 63) | 128);
        }
        e.push((g & 63) | 128);
      }
    }

    let a = tkk;

    for (let h = 0; h < e.length; h++) {
      a += e[h];
      a = tokenTransform(a, '+-a^+6');
    }
    a = tokenTransform(a, '+-3^+b+-f');
    a ^= tkk;

    if (a < 0) {
      a = (a & 2147483647) + 2147483648;
    }
    a %= 1e6;

    return a.toString() + '.' + (a ^ tkk);
  }
}
