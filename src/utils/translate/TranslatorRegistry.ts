// src/utils/TranslatorRegistry.ts

import { TranslatorDriver } from './drivers/TranslatorDriver';
import { GoogleTranslator } from './drivers/GoogleTranslator';
import { DeepLTranslator } from './drivers/DeepLTranslator';
import { YandexTranslator } from './drivers/YandexTranslator';
import { OpenAITranslator } from './drivers/OpenAITranslator';
import { AzureTranslator } from './drivers/AzureTranslator';
import { IBMTranslator } from './drivers/IBMTranslator';
import { BaiduTranslator } from './drivers/BaiduTranslator';
import { GoogleFreeTranslator } from './drivers/GoogleFreeTranslator';
import { LibreTranslateTranslator } from './drivers/LibreTranslateTranslator';
import { MyMemoryTranslator } from './drivers/MyMemoryTranslator';
import { LingvaTranslateTranslator } from './drivers/LingvaTranslateTranslator';
import { PapagoTranslator } from './drivers/PapagoTranslator';
import { TencentTranslator } from './drivers/TencentTranslator';
import { SystranTranslator } from './drivers/SystranTranslator';
import { YandexCloudTranslator } from './drivers/YandexCloudTranslator';
import { ModernMTTranslator } from './drivers/ModernMTTranslator';
import { LiltTranslator } from './drivers/LiltTranslator';
import { UnbabelTranslator } from './drivers/UnbabelTranslator';
import { ReversoTranslator } from './drivers/ReversoTranslator';

// Тип для конструктора переводчика
type TranslatorConstructor = new (apiKey: string, options?: any) => TranslatorDriver;

const translatorRegistry: { [key: string]: TranslatorConstructor } = {
  'google': GoogleTranslator,
  'deepl': DeepLTranslator,
  'yandex': YandexTranslator,
  'openai': OpenAITranslator,
  'azure': AzureTranslator,
  'ibm': IBMTranslator,
  'baidu': BaiduTranslator,
  'googlefree': GoogleFreeTranslator,
  'libretranslate': LibreTranslateTranslator,
  'mymemory': MyMemoryTranslator,
  'lingvatranslate': LingvaTranslateTranslator,
  'papago': PapagoTranslator,
  'tencent': TencentTranslator,
  'systran': SystranTranslator,
  'yandexcloud': YandexCloudTranslator,
  'modernmt': ModernMTTranslator,
  'lilt': LiltTranslator,
  'unbabel': UnbabelTranslator,
  'reverso': ReversoTranslator,
  // Добавьте другие сервисы по мере необходимости
};

export default translatorRegistry;
