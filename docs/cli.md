---
outline: deep
---

# 🌐 nuxt-i18n-micro-cli Guide

## 📖 Introduction

`nuxt-i18n-micro-cli` is a command-line tool designed to streamline the localization and internationalization process in Nuxt.js projects using the `nuxt-i18n` module. It provides utilities to extract translation keys from your codebase, manage translation files, synchronize translations across locales, and automate the translation process using external translation services.

This guide will walk you through installing, configuring, and using `nuxt-i18n-micro-cli` to effectively manage your project's translations. Package on [npmjs.com](https://www.npmjs.com/package/nuxt-i18n-micro-cli).

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

### 📄 Common Arguments

- `--cwd`: Specify the current working directory (defaults to `.`).
- `--logLevel`: Set the log level (`silent`, `info`, `verbose`).
- `--translationDir`: Directory containing JSON translation files (default: `locales`).

## 📋 Commands

### 💾 `backup` Command

**Description**: Create a backup of translation files

**Usage**:

```bash
i18n-micro backup [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)
- `--backupDir`: Directory to save backup files (default: `"locales/backups"`)
- `--password`: Password for encrypting the backup archive
- `--comment`: Comment to add to the backup archive

---

### 🔍 `check-duplicates` Command

**Description**: Check for duplicate translation values within each language across all files (global and pages)

**Usage**:

```bash
i18n-micro check-duplicates [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)

---

### 🧹 `clean` Command

**Description**: Remove unused and empty translation keys from translation files

**Usage**:

```bash
i18n-micro clean [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)
- `--include`: Regular expression to include only matching keys
- `--exclude`: Regular expression to exclude matching keys

---

### 📝 `diff` Command

**Description**: Compares translation files between the default locale and other locales in the same directory, including subdirectories, showing missing keys and their values in the default locale.

**Usage**:

```bash
i18n-micro diff [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level

---

### 📊 `export-csv` Command

**Description**: Export translations to CSV files, including from subdirectories

**Usage**:

```bash
i18n-micro export-csv [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)
- `--csvDir`: Directory to save CSV files (default: `"csv_exports"`)

---

### 🛠️ `extract` Command

**Description**: Extract translations and organize them by scope

**Usage**:

```bash
i18n-micro extract [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)
- `--prod`: production mode

---

### ✨ `format` Command

**Description**: Format translation files by sorting keys and applying consistent indentation

**Usage**:

```bash
i18n-micro format [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing translation files (default: `"locales"`)
- `--indent`: Number of spaces for indentation (default: `"2"`)
- `--sortKeys`: Sort translation keys alphabetically (default: `true`)

---

### 📥 `import` Command

**Description**: Convert PO files back to JSON format and save in translationDir

**Usage**:

```bash
i18n-micro import [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--potsDir`: Directory containing PO files (default: `"pots"`)
- `--translationDir`: Directory to save JSON translation files (default: `"locales"`)

---

### 📊 `import-csv` Command

**Description**: Import translations from CSV files, including from subdirectories

**Usage**:

```bash
i18n-micro import-csv [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)
- `--csvDir`: Directory containing CSV files to import (default: `"csv_exports"`)

---

### ℹ️ `info` Command

**Description**: Display detailed information about the CLI, project configuration, and system environment

**Usage**:

```bash
i18n-micro info [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--json`: Output information in JSON format (default: `false`)
- `--debug`: Show additional debug information (default: `false`)

---

### 🚀 `init` Command

**Description**: Initialize a new Nuxt 3 project with nuxt-i18n-micro

**Usage**:

```bash
i18n-micro init [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level

---

### 🔍 `lint` Command

**Description**: Check translation quality

**Usage**:

```bash
i18n-micro lint [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing translation files (default: `"locales"`)
- `--rules`: List of rules to check (comma-separated) (default: `"no-trailing-spaces,no-multiple-spaces,no-empty-translation,no-html-tags,no-special-chars,no-mixed-case,no-missing-punctuation,no-inconsistent-pluralization"`)
- `--fix`: Automatically fix found issues (default: `false`)

---

### ⚡ `optimize` Command

**Description**: Optimize translation files structure

**Usage**:

```bash
i18n-micro optimize [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)
- `--minSize`: Minimum file size in bytes to consider for optimization (default: `"1024"`)
- `--maxDepth`: Maximum nesting depth for translation keys (default: `"3"`)
- `--dryRun`: Show optimization suggestions without making changes (default: `false`)
- `--updatePaths`: Update translation paths in Vue and JS files after optimization (default: `true`)

---

### 🔄 `replace-values` Command

**Description**: Bulk replace translation values across all locales

**Usage**:

```bash
i18n-micro replace-values [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)
- `--search`: Text or regex pattern to search for
- `--replace`: Replacement text, can include regex group references
- `--useRegex`: Enable regex search for pattern matching (default: `false`)

---

### 🔄 `restore` Command

**Description**: Restore translation files from a backup

**Usage**:

```bash
i18n-micro restore [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)
- `--backupDir`: Directory containing backup files (default: `"locales/backups"`)
- `--backup`: Name of the backup to restore from (without .zip extension)
- `--password`: Password for decrypting the backup archive
- `--force`: Skip confirmation prompt (default: `false`)

---

### ✂️ `split` Command

**Description**: Split large translation files into smaller ones based on specified criteria

**Usage**:

```bash
i18n-micro split [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)
- `--maxKeys`: Maximum number of keys per file (default: `"100"`)
- `--maxDepth`: Maximum nesting depth for splitting (default: `"2"`)
- `--splitByPrefix`: Split files by key prefix (default: `false`)
- `--outputDir`: Directory to save split translation files (default: `"locales/split"`)

---

### 📊 `stats` Command

**Description**: Display translation statistics for each locale

**Usage**:

```bash
i18n-micro stats [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)
- `--full`: Display detailed statistics (default: `false`)
- `--html`: Generate HTML report to specified file (default: `""`)

---

### 🔄 `sync` Command

**Description**: Synchronize translation files across locales

**Usage**:

```bash
i18n-micro sync [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)

---

### 🌐 `sync-remote` Command

**Description**: Synchronize translations with remote storage

**Usage**:

```bash
i18n-micro sync-remote [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing translation files
- `--pull`: Pull translations from remote storage (default: `true`)
- `--push`: Push translations to remote storage (default: `false`)
- `--force`: Force synchronization (overwrite local changes) (default: `false`)
- `--dryRun`: Perform a dry run without making changes (default: `false`)

---

### 🔄 `text-to-i18n` Command

**Description**: Replace text in files with translation references

**Usage**:

```bash
i18n-micro text-to-i18n [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationFile`: Path to the JSON file containing translations (default: `"locales/en.json"`)
- `--path`: Custom path to file or directory to process
- `--context`: Context prefix for translation keys
- `--dryRun`: Show changes without modifying files (default: `false`)
- `--verbose`: Show detailed processing information (default: `false`)

---

### 🌍 `translate` Command

**Description**: Automatically translate missing keys using external translation services

**Usage**:

```bash
i18n-micro translate [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)
- `--service`: Translation service to use (e.g., google,deepl,yandex) (default: `"google"`)
- `--token`: API key corresponding to the translation service
- `--options`: Additional options for the translation service in key:value pairs, separated by commas

---

### ✅ `validate` Command

**Description**: Validate translation files for missing or extra keys

**Usage**:

```bash
i18n-micro validate [options]
```

**Options**:

- `--cwd`: Current working directory
- `--logLevel`: Log level
- `--translationDir`: Directory containing JSON translation files (default: `"locales"`)

---

