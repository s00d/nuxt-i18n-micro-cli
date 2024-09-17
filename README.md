# Nuxt i18n CLI


## 📖 Introduction

`nuxt-i18n-micro-cli` is a command-line tool designed to streamline the localization and internationalization process in Nuxt.js projects using the `nuxt-i18n` module. It provides utilities to extract translation keys from your codebase, manage translation files, synchronize translations across locales, and automate the translation process using external translation services.

This guide will walk you through installing, configuring, and using `nuxt-i18n-micro-cli` to effectively manage your project's translations.

## 🔧 Installation and Setup

### 📦 Installing nuxt-i18n-micro-cli

Install `nuxt-i18n-micro-cli` globally using npm:

```bash
npm install -g nuxt-i18n-micro-cli
```

This will make the `i18n-micro` command available globally on your system.

### 🛠 Initializing in Your Project

After installing, you can run `i18n-micro` commands in your Nuxt.js project directory.

Ensure that your project is set up with `nuxt-i18n` and has the necessary configuration in `nuxt.config.js`.

## 🗂️ Commands and Usage

`nuxt-i18n-micro-cli` provides several commands to help manage your translations:

- [`extract`](#extract): Extract translation keys from your codebase.
- [`translate`](#translate): Automatically translate missing keys using external translation services.
- [`sync`](#sync): Synchronize translation files across locales.
- [`validate`](#validate): Validate translation files for missing or extra keys.
- [`stats`](#stats): Display translation statistics for each locale.
- [`clean`](#clean): Remove unused translation keys from translation files.
- [`import`](#import): Convert PO files back to JSON format.
- [`export`](#export): Export translations to PO files for external translation management.

Each command can be run using `i18n-micro <command>`.

### 📄 Common Arguments

- `--cwd`: Specify the current working directory (defaults to `.`).
- `--logLevel`: Set the log level (`silent`, `info`, `verbose`).

### 📋 Commands

#### extract

**Description**: Extracts translation keys from your codebase and organizes them by scope.

**Usage**:

```bash
i18n-micro extract [options]
```

**Options**:

- `--prod, -p`: Run in production mode.

**Example**:

```bash
i18n-micro extract
```

This command scans your project files, extracts translation keys used in components, pages, layouts, etc., and generates translation files in the specified translation directory (default is `locales`).

#### translate

**Description**: Automatically translates missing or all keys using external translation services.

**Usage**:

```bash
i18n-micro translate [options]
```

**Options**:

- `--translationDir`: Directory containing JSON translation files (default: `locales`).
- `--service`: Translation service to use (e.g., `google`, `deepl`, `yandex`, etc.) (default: `google`).
- `--token`: API key corresponding to the translation service.
- `--options`: Additional options for the translation service in `key:value` pairs, separated by commas.
- `--replace`: Translate all keys, replacing existing translations (default: `false`).

**Example**:

```bash
i18n-micro translate --service deepl --token YOUR_DEEPL_API_KEY
```

This command translates missing keys in your translation files using the specified translation service and saves the translations in the corresponding files.

#### sync

**Description**: Synchronizes translation files across locales, ensuring all locales have the same keys.

**Usage**:

```bash
i18n-micro sync [options]
```

**Options**:

- `--translationDir`: Directory containing JSON translation files (default: `locales`).

**Example**:

```bash
i18n-micro sync
```

This command synchronizes the translation files based on the reference locale (the first locale specified in your `nuxt.config.js`), adding missing keys and ensuring consistency.

#### validate

**Description**: Validates translation files for missing or extra keys compared to the reference locale.

**Usage**:

```bash
i18n-micro validate [options]
```

**Options**:

- `--translationDir`: Directory containing JSON translation files (default: `locales`).

**Example**:

```bash
i18n-micro validate
```

This command checks for missing or extra keys in your translation files and reports any discrepancies.

#### stats

**Description**: Displays translation statistics for each locale.

**Usage**:

```bash
i18n-micro stats [options]
```

**Options**:

- `--translationDir`: Directory containing JSON translation files (default: `locales`).

**Example**:

```bash
i18n-micro stats
```

This command shows the number of translated keys and the completion percentage for each locale compared to the reference locale.

#### clean

**Description**: Removes unused translation keys from translation files.

**Usage**:

```bash
i18n-micro clean [options]
```

**Options**:

- `--translationDir`: Directory containing JSON translation files (default: `locales`).

**Example**:

```bash
i18n-micro clean
```

This command removes translation keys that are no longer used in your codebase from the translation files.

#### import

**Description**: Converts PO files back to JSON format and saves them in the translation directory.

**Usage**:

```bash
i18n-micro import [options]
```

**Options**:

- `--potsDir`: Directory containing PO files (default: `pots`).
- `--translationDir`: Directory to save JSON translation files (default: `locales`).

**Example**:

```bash
i18n-micro import --potsDir pots --translationDir locales
```

This command converts PO files to JSON and saves them in the specified translation directory.

#### export

**Description**: Exports translations to PO files for external translation management.

**Usage**:

```bash
i18n-micro export [options]
```

**Options**:

- `--potsDir`: Directory to save PO files (default: `pots`).
- `--translationDir`: Directory containing JSON translation files (default: `locales`).

**Example**:

```bash
i18n-micro export --potsDir pots
```

This command converts your JSON translation files to PO files, which can be used with external translation tools.

### 🛠 Examples

- **Extracting translations**:

  ```bash
  i18n-micro extract
  ```

- **Translating missing keys using Google Translate**:

  ```bash
  i18n-micro translate --service google --token YOUR_GOOGLE_API_KEY
  ```

- **Translating all keys, replacing existing translations**:

  ```bash
  i18n-micro translate --service deepl --token YOUR_DEEPL_API_KEY --replace
  ```

- **Validating translation files**:

  ```bash
  i18n-micro validate
  ```

- **Cleaning unused translation keys**:

  ```bash
  i18n-micro clean
  ```

- **Synchronizing translation files**:

  ```bash
  i18n-micro sync
  ```

## ⚙️ Configuration Guide

`nuxt-i18n-micro-cli` relies on your Nuxt.js i18n configuration in `nuxt.config.js`. Ensure you have the `nuxt-i18n` module installed and configured.

### 🔑 nuxt.config.js Example

```js
export default {
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US' },
      { code: 'fr', iso: 'fr-FR' },
      { code: 'es', iso: 'es-ES' },
      // Add other locales as needed
    ],
    defaultLocale: 'en',
    vueI18n: {
      fallbackLocale: 'en',
    },
    // Specify the directory where your translation files are stored
    translationDir: 'locales',
  },
};
```

Ensure that the `translationDir` matches the directory used by `nuxt-i18n-micro-cli` (default is `locales`).

## 🌐 Supported Translation Services

The `translate` command supports multiple translation services. Some of the supported services are:

- **Google Translate** (`google`)
- **DeepL** (`deepl`)
- **Yandex Translate** (`yandex`)
- **OpenAI** (`openai`)
- **Azure Translator** (`azure`)
- **IBM Watson** (`ibm`)
- **Baidu Translate** (`baidu`)
- **LibreTranslate** (`libretranslate`)
- **MyMemory** (`mymemory`)
- **Lingva Translate** (`lingvatranslate`)
- **Papago** (`papago`)
- **Tencent Translate** (`tencent`)
- **Systran Translate** (`systran`)
- **Yandex Cloud Translate** (`yandexcloud`)
- **ModernMT** (`modernmt`)
- **Lilt** (`lilt`)
- **Unbabel** (`unbabel`)
- **Reverso Translate** (`reverso`)

### ⚙️ Service Configuration

Some services require specific configurations or API keys. When using the `translate` command, you can specify the service and provide the required `--token` (API key) and additional `--options` if needed.

For example:

```bash
i18n-micro translate --service openai --token YOUR_OPENAI_API_KEY --options openaiModel:gpt-3.5-turbo,max_tokens:1000
```

## 📝 Best Practices

### 🔑 Consistent Key Naming

Ensure translation keys are consistent and descriptive to avoid confusion and duplication.

### 🧹 Regular Maintenance

Use the `clean` command regularly to remove unused translation keys and keep your translation files clean.

### 🛠 Automate Translation Workflow

Integrate `nuxt-i18n-micro-cli` commands into your development workflow or CI/CD pipeline to automate extraction, translation, validation, and synchronization of translation files.

### 🛡️ Secure API Keys

When using translation services that require API keys, ensure your keys are kept secure and not committed to version control systems. Consider using environment variables or secure key management solutions.

## 📞 Support and Contributions

If you encounter issues or have suggestions for improvements, feel free to contribute to the project or open an issue on the project's repository.

## License

[MIT](./LICENSE)
