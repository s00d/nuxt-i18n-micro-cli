// src/commands/clean.ts

import { defineCommand } from 'citty';
import { resolve } from 'pathe';
import { loadKit } from '../utils/kit';
import { loadJsonFile, writeJsonFile } from '../utils/json';
import path from 'node:path';
import consola from 'consola';
import fs from 'node:fs';
import { extractTranslations } from '../utils/components';

export default defineCommand({
  meta: {
    name: 'clean',
    description: 'Remove unused translation keys from translation files',
  },
  args: {
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
  },
  async run({ args }: { args: { cwd?: string; translationDir?: string } }) {
    const cwd = resolve((args.cwd || '.').toString());

    const kit = await loadKit(cwd);
    const nuxt = await kit.loadNuxt({
      cwd,
      dotenv: { cwd },
    });

    const locales = (nuxt.options as any).i18n.locales ?? [];
    const translationDir = path.resolve(
      cwd,
      args.translationDir ?? (nuxt.options as any).i18n.translationDir ?? 'locales'
    );

    // Извлекаем используемые ключи из кодовой базы
    const translationData = extractTranslations(cwd);
    const usedGlobalKeys = translationData.global;
    const usedPageSpecificKeys = translationData.pageSpecific;

    // Для каждой локали удаляем неиспользуемые ключи
    for (const locale of locales) {
      const { code } = locale;

      // Очистка глобальных переводов
      const globalTranslationsPath = path.join(translationDir, `${code}.json`);
      let globalTranslations = loadJsonFile(globalTranslationsPath);
      globalTranslations = cleanTranslations(globalTranslations, usedGlobalKeys);
      writeJsonFile(globalTranslationsPath, globalTranslations);
      consola.info(`Cleaned global translations for locale ${code}`);

      // Очистка переводов для страниц
      const pagesDir = path.join(translationDir, 'pages');
      if (fs.existsSync(pagesDir)) {
        const pages = fs.readdirSync(pagesDir);
        for (const page of pages) {
          const pageTranslationsPath = path.join(pagesDir, page, `${code}.json`);
          if (fs.existsSync(pageTranslationsPath)) {
            let pageTranslations = loadJsonFile(pageTranslationsPath);
            const usedKeys = usedPageSpecificKeys[page] || new Set<string>();
            pageTranslations = cleanTranslations(pageTranslations, usedKeys);
            writeJsonFile(pageTranslationsPath, pageTranslations);
            consola.info(`Cleaned translations for page ${page} and locale ${code}`);
          }
        }
      }
    }

    consola.success('Unused translation keys have been removed.');
  },
});

function cleanTranslations(translations: Record<string, unknown>, usedKeys: Set<string>): Record<string, unknown> {
  const cleanedTranslations: Record<string, unknown> = {};
  for (const key in translations) {
    if (usedKeys.has(key)) {
      const value = translations[key];
      if (typeof value === 'object' && value !== null) {
        cleanedTranslations[key] = cleanTranslations(value as Record<string, unknown>, usedKeys);
      } else {
        cleanedTranslations[key] = value;
      }
    }
  }
  return cleanedTranslations;
}
