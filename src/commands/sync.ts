import { defineCommand } from 'citty';
import { resolve } from 'pathe';
import { loadKit } from '../utils/kit';
import { loadJsonFile, writeJsonFile } from '../utils/json';
import path from 'node:path';
import consola from 'consola';

export default defineCommand({
  meta: {
    name: 'sync',
    description: 'Synchronize translation files across locales',
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
    const translationDir = path.resolve(cwd, args.translationDir ?? (nuxt.options as any).i18n.translationDir ?? 'locales');

    // Эталонная локаль
    const referenceLocale = locales[0].code;
    const referenceTranslations = loadJsonFile(path.join(translationDir, `${referenceLocale}.json`));

    for (const locale of locales) {
      const { code } = locale;
      if (code === referenceLocale) continue;

      const translations = loadJsonFile(path.join(translationDir, `${code}.json`));

      const synchronizedTranslations = synchronizeTranslations(referenceTranslations, translations);

      // Записываем обратно в файл
      const translationFilePath = path.join(translationDir, `${code}.json`);
      writeJsonFile(translationFilePath, synchronizedTranslations);

      consola.log(`Translations for locale ${code} have been synchronized.`);
    }
  },
});

function synchronizeTranslations(reference: Record<string, unknown>, target: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key in reference) {
    const refValue = reference[key];
    const targetValue = target[key];

    if (typeof refValue === 'object' && refValue !== null) {
      if (typeof targetValue === 'object' && targetValue !== null) {
        result[key] = synchronizeTranslations(refValue as Record<string, unknown>, targetValue as Record<string, unknown>);
      } else {
        result[key] = synchronizeTranslations(refValue as Record<string, unknown>, {});
      }
    } else {
      if (typeof targetValue === 'string') {
        result[key] = targetValue;
      } else {
        result[key] = '';
      }
    }
  }

  return result;
}
