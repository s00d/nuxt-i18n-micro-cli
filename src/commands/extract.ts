import fs from 'node:fs';
import path from 'node:path';
import { defineCommand } from 'citty';
import glob from 'glob';
import { resolve } from 'pathe';
import { loadKit } from '../utils/kit';
import { keyToNestedObject, loadJsonFile } from '../utils/json';
import { ensureDirectoryExists } from '../utils/dir';
import { sharedArgs } from './_shared';
import consola from 'consola';

// Интерфейсы для данных перевода и локалей
interface TranslationData {
  pageSpecific: Record<string, Set<string>>;
  global: Set<string>;
}

interface LocaleTranslation {
  global: Record<string, unknown>;
  pageSpecific: Record<string, Record<string, unknown>>;
}

// Функция для преобразования путей к файлам в формат snake_case
function toSnakeCase(name: string): string {
  return name
    .replace(/\.vue$/, '') // Удаляем расширение .vue
    .replace(/\//g, '-') // Заменяем слеши на тире
    .replace(/\[.*?\]/g, '') // Удаляем квадратные скобки и их содержимое
    .replace(/[^\w\s-]/g, '') // Удаляем все символы, кроме букв, цифр, тире и пробелов
    .replace(/\s+/g, '_') // Заменяем пробелы на подчёркивания
    .replace(/-{2,}/g, '-') // Объединяем несколько тире в одно
    .replace(/-$|^-/g, '') // Удаляем тире в начале и в конце
    .replace(/-index/g, '') // Удаляем тире в начале и в конце
    .toLowerCase(); // Преобразуем в нижний регистр
}

// Функция для извлечения ключей из содержимого файла
function extractKeys(content: string): Set<string> {
  const keys = new Set<string>();
  const tRegex = /\$t\(['"`]([^'"`]+)['"`]\)/g;
  const tcRegex = /\$tc\(['"`]([^'"`]+)['"`],\s*\d+\)/g;

  let match;
  while ((match = tRegex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  while ((match = tcRegex.exec(content)) !== null) {
    keys.add(match[1]);
  }

  return keys;
}

// Функция для получения всех компонентов и формирования возможных названий
function getComponentNames(componentDir: string): Record<string, string[]> {
  const componentFiles = glob.sync('**/*.{js,ts,vue}', { cwd: componentDir, ignore: 'node_modules/**' });
  const componentNames: Record<string, string[]> = {};

  componentFiles.forEach((file) => {
    const relativePath = path.relative(componentDir, file);
    const componentName = path.basename(file, path.extname(file)); // Имя файла без расширения

    // Разделяем путь на части и исключаем пустые части и '..'
    const dirParts = path.dirname(relativePath).split(path.sep).filter(part => part.trim().length > 0 && part !== '..');

    const fullNameParts = [...dirParts, componentName]; // Комбинируем подпапки и имя файла

    // Формируем имена в kebab-case и PascalCase
    const kebabCaseName = fullNameParts
      .map(part => part.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()) // Преобразуем в kebab-case
      .join('-');
    const pascalCaseName = fullNameParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1)) // Преобразуем в PascalCase
      .join('');

    componentNames[path.join(componentDir, file)] = [kebabCaseName, pascalCaseName];
  });

  return componentNames;
}

// Функция для поиска компонентов в содержимом с учетом возможных названий
function findComponentsInContent(content: string, componentNames: Record<string, string[]>): string[] {
  const foundComponents: string[] = [];

  Object.entries(componentNames).forEach(([componentPath, names]) => {
    names.forEach((name) => {
      if (content === name) {
        foundComponents.push(componentPath);
      }
    });
  });

  return foundComponents;
}

// Функция для извлечения всех переводов из проекта
function extractTranslations(cwd: string): TranslationData {
  const translationData: TranslationData = {
    pageSpecific: {},
    global: new Set<string>(),
  };

  // Сканируем папки для переводов
  const pageFiles = glob.sync('pages/**/*.{js,ts,vue}', { cwd, ignore: 'node_modules/**' });
  const globalFiles = glob.sync('{layouts,components,plugins,composables}/**/*.{js,ts,vue}', { cwd, ignore: 'node_modules/**' });

  // Сканируем страницы
  pageFiles.forEach((file) => {
    const content = fs.readFileSync(path.join(cwd, file), 'utf8');
    const relativePath = path.relative('pages', file).replace(/\.[jt]s$/, '');
    const pageKey = toSnakeCase(relativePath);
    const keys = extractKeys(content);

    // Ищем компоненты, используемые на страницах
    const componentDir = path.resolve(cwd, 'components');
    const componentNames = getComponentNames(componentDir);

    const componentMatches = content.match(/<([A-Z][a-zA-Z0-9]*|[a-z]+(?:-[a-z]+)+)/g) || [];

    componentMatches.forEach((componentTag) => {
      const componentName = componentTag.replace('<', '').toLowerCase();

      // Поиск компонентов на основе предопределенных возможных названий
      const componentFiles = findComponentsInContent(componentName, componentNames);

      componentFiles.forEach((componentFile) => {
        const componentContent = fs.readFileSync(componentFile, 'utf8');
        const componentKeys = extractKeys(componentContent);
        componentKeys.forEach(key => keys.add(key));
      });
    });

    translationData.pageSpecific[pageKey] = keys;
  });

  // Сканируем глобальные файлы
  globalFiles.forEach((file) => {
    const content = fs.readFileSync(path.join(cwd, file), 'utf8');
    const keys = extractKeys(content);
    keys.forEach(key => translationData.global.add(key));
  });

  return translationData;
}

// Функция для преобразования ключей в вложенные объекты
function convertToNestedObjects(keys: Set<string>): Record<string, unknown> {
  const nestedObject: Record<string, unknown> = {};
  keys.forEach((key) => {
    const nested = keyToNestedObject(key);
    Object.assign(nestedObject, nested);
  });
  return nestedObject;
}

export default defineCommand({
  meta: {
    name: 'export',
    description: 'Extract translations and organize them by scope',
  },
  args: {
    ...sharedArgs,
    prod: {
      type: 'boolean',
      description: 'production mode',
      alias: 'p',
    }
  },
  async run({ args }: { args: { cwd?: string, logLevel?: string } }) {
    consola.log('Parsed args:', args);

    const cwd = resolve((args.cwd || '.').toString());

    const kit = await loadKit(cwd);
    const nuxt = await kit.loadNuxt({
      cwd,
      dotenv: { cwd },
      overrides: { logLevel: args.logLevel as 'silent' | 'info' | 'verbose' },
    });

    const locales = (nuxt.options as any).i18n.locales ?? [];
    const translationDir = path.resolve(cwd, (nuxt.options as any).i18n.translationDir ?? 'locales');

    ensureDirectoryExists(translationDir);

    const translationData = extractTranslations(cwd);

    const pageSpecificTranslations = Object.entries(translationData.pageSpecific).reduce((acc, [page, keys]) => {
      acc[page] = convertToNestedObjects(keys);
      return acc;
    }, {} as Record<string, Record<string, unknown>>);

    // Создаем объекты локалей
    const localeObjects = locales.reduce((acc: Record<string, LocaleTranslation>, locale: { code: string }) => {
      const { code } = locale;
      const globalTranslations = loadJsonFile(path.join(translationDir, `${code}.json`));
      const completeGlobalTranslations = {
        ...convertToNestedObjects(translationData.global),
        ...globalTranslations,
      };

      acc[code] = {
        global: completeGlobalTranslations,
        pageSpecific: Object.entries(pageSpecificTranslations).reduce((pageAcc, [page, translations]) => {
          const pageTranslationsPath = path.join(translationDir, 'pages', page, `${code}.json`);
          const loadedTranslations = loadJsonFile(pageTranslationsPath);

          // Добавляем все ключи с пустыми строками, если их нет в переводах
          const completeTranslations = Object.keys(translations).reduce((nestedAcc, key) => {
            const existingValue = key in loadedTranslations ? (loadedTranslations[key] as string) : '';
            nestedAcc[key] = existingValue || translations[key];
            return nestedAcc;
          }, {} as Record<string, unknown>);

          pageAcc[page] = {
            ...loadedTranslations,
            ...completeTranslations,
          };
          return pageAcc;
        }, {} as Record<string, Record<string, unknown>>),
      };
      return acc;
    }, {} as Record<string, LocaleTranslation>);

    // Сохранение в формат JSON
    Object.entries(localeObjects).forEach(([locale, translation]) => {
      const { global, pageSpecific } = translation as LocaleTranslation;

      const globalJsonPath = path.join(translationDir, `${locale}.json`);
      fs.writeFileSync(globalJsonPath, JSON.stringify(global, null, 2));

      Object.entries(pageSpecific).forEach(([page, translations]) => {
        const pageJsonPath = path.join(translationDir, 'pages', page, `${locale}.json`);
        ensureDirectoryExists(path.dirname(pageJsonPath));
        fs.writeFileSync(pageJsonPath, JSON.stringify(translations, null, 2));
      });
    });

    consola.log('Locale-specific translations have been saved to JSON files.');
  },
});
