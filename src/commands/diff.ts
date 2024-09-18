import fs from 'node:fs';
import path from 'node:path';
import { defineCommand } from 'citty';
import { resolve } from 'pathe';
import consola from 'consola';
import { loadJsonFile } from '../utils/json';
import { sharedArgs } from './_shared';
import { getI18nConfig } from "../utils/kit";

interface DiffResult {
  file: string;
  type?: 'missing_in_locale';
  missingInLocale?: Array<{ key: string; defaultValue: string }>;
}

export default defineCommand({
  meta: {
    name: 'diff',
    description: 'Compares translation files between the default locale and other locales in the same directory, including subdirectories, showing missing keys and their values in the default locale.',
  },
  args: {
    ...sharedArgs,
    output: {
      type: 'string',
      description: 'Output format (text, json).',
      default: 'text',
    },
  },
  async run({ args }: { args: { translationDir?: string, output: string, cwd?: string, logLevel?: string } }) {
    const cwd = resolve((args.cwd || '.').toString());
    const { locales, defaultLocale, translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel);

    const sourceDir = args.translationDir || defaultTranslationDir;

    if (!fs.existsSync(sourceDir)) {
      consola.error(`Source directory "${sourceDir}" does not exist.`);
      return;
    }

    const defaultFiles = getAllJsonPaths(sourceDir, defaultLocale);

    const diffResults: DiffResult[] = [];

    for (const locale of locales) {
      const { code } = locale;
      if (code === defaultLocale) continue;

      const localeFiles = getAllJsonPaths(sourceDir, code);

      defaultFiles.forEach((defaultFilePath) => {
        const relativePath = path.relative(sourceDir, defaultFilePath);
        const localeFilePath = defaultFilePath.replace(`${defaultLocale}.json`, `${code}.json`);

        if (!localeFiles.includes(localeFilePath)) {
          diffResults.push({ file: relativePath, type: 'missing_in_locale' });
          return;
        }

        const defaultTranslations = loadJsonFile(defaultFilePath);
        const localeTranslations = loadJsonFile(localeFilePath);
        const flattenedDefaultTranslations = flattenTranslations(defaultTranslations);
        const flattenedLocaleTranslations = flattenTranslations(localeTranslations);

        const missingInLocale = Object.keys(flattenedDefaultTranslations)
          .filter(key => !(key in flattenedLocaleTranslations))
          .map(key => ({
            key,
            defaultValue: flattenedDefaultTranslations[key],
          }));

        if (missingInLocale.length > 0) {
          diffResults.push({
            file: relativePath,
            missingInLocale,
          });
        }
      });
    }

    if (args.output === 'json') {
      console.log(JSON.stringify(diffResults, null, 2));
    } else {
      diffResults.forEach(diff => {
        if (diff.missingInLocale?.length) {
          consola.info(`Missing in file: ${diff.file}`);
          diff.missingInLocale.forEach(({ key, defaultValue }) => {
            consola.info(` - Key: ${key} | Default Value: "${defaultValue}"`);
          });
        }
        if (diff.type === 'missing_in_locale') {
          consola.error(`Missing locale file: ${diff.file}`);
        }
        consola.log('');
      });
    }
  },
});

function getAllJsonPaths(dir: string, locale: string): string[] {
  const paths: string[] = [];
  if (fs.existsSync(dir)) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        paths.push(...getAllJsonPaths(fullPath, locale));
      } else if (entry.isFile() && path.extname(entry.name) === '.json' && entry.name.includes(locale)) {
        paths.push(fullPath);
      }
    });
  }
  return paths;
}

function flattenTranslations(translations: Record<string, unknown>, prefix = ''): Record<string, string> {
  let result: Record<string, string> = {};
  for (const key in translations) {
    const value = translations[key];
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[newPrefix] = value;
    } else if (typeof value === 'object' && value !== null) {
      result = { ...result, ...flattenTranslations(value as Record<string, unknown>, newPrefix) };
    }
  }
  return result;
}
