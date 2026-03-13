<template>
  <div>
    <h1>{{ $t('landing.title') }}</h1>
    <p>{{ $t('landing.subtitle') }}</p>
    <p><strong>Layer active:</strong> {{ $t('layerMeta.active') }}</p>
    <p><strong>Layer base:</strong> {{ $t('layerMeta.base') }}</p>
    <p><strong>Layer root-only:</strong> {{ $t('layerMeta.rootOnly') }}</p>

    <p>{{ $t('key1.key1.key1.key1.key1') }}</p>
    <p>Current Locale: {{ $getLocale() }}</p>
    <p>Current route without locale: {{ $getRouteName() }}</p>

    <!-- Ссылки для переключения локалей -->
    <div>
      <button
        v-for="locale in $getLocales()"
        :key="locale.code"
        :disabled="locale.code === $getLocale()"
        @click="$switchLocale(locale.code)"
      >
        Switch to {{ locale.code }}
      </button>
    </div>

    <p id="localized-route">
      {{ $localeRoute({ name: 'page' }, 'de').path }}
    </p>

    <div>
      <i18n-link :to="{ name: 'page' }">
        Go to Page
      </i18n-link>
      |
      <i18n-link :to="{ name: 'catalog' }">
        Go to Catalog
      </i18n-link>
      |
      <i18n-link :to="{ name: 'faq' }">
        Go to FAQ
      </i18n-link>
      |
      <i18n-link :to="{ name: 'long-read' }">
        Go to Long Read
      </i18n-link>
      |
      <i18n-link :to="{ name: 'lorem-a' }">
        Go to Lorem A
      </i18n-link>
      |
      <i18n-link :to="{ name: 'lorem-b' }">
        Go to Lorem B
      </i18n-link>
      |
      <i18n-link :to="{ name: 'base-root' }">
        Go to Base Root Layer Page
      </i18n-link>
      |
      <i18n-link :to="{ name: 'layer-base' }">
        Go to Layer Base Page
      </i18n-link>
      |
      <i18n-link :to="{ name: 'layer-marketing' }">
        Go to Layer Marketing Page
      </i18n-link>
      |
      <i18n-link :to="{ name: 'guides-slug', params: { slug: 'advanced-routing' } }">
        Go to Guide (dynamic)
      </i18n-link>
      |
      <i18n-link :to="{ name: 'docs-section-page', params: { section: 'architecture', page: 'layered-i18n' } }">
        Go to Docs (nested dynamic)
      </i18n-link>
      |
      <i18n-link :to="{ name: 'fixtures' }">
        Go to Fixtures Playground
      </i18n-link>
    </div>

    <a href="/">test</a>

    <div>
      <i18n-switcher
        :custom-labels="{ en: 'English', de: 'Deutsch', ru: 'Русский' }"
      />
    </div>

    <div
      v-for="key in generatedKeys"
      :key="key"
    >
      <p>{{ key }}: <span v-if="$has(key)">{{ $t(key) }}</span></p>
    </div>
  </div>
</template>

<script setup>
// Function to generate keys with a fixed pattern
function generateKeys(depth, maxKeys = 4) {
  const keys = []

  const generate = (prefix = '', currentDepth = depth) => {
    if (currentDepth === 0) {
      for (let i = 0; i <= maxKeys; i++) {
        // Генерируем ключ с инкрементом по последнему элементу
        keys.push(`${prefix}key${i}`)
      }
      return
    }

    for (let i = 0; i <= maxKeys; i++) {
      // Добавляем к префиксу текущий элемент
      generate(`${prefix}key${i}.`, currentDepth - 1)
    }
  }

  generate()
  return keys
}

const generatedKeys = ref(generateKeys(4))
</script>
