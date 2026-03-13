<template>
  <div class="split-test">
    <h1>{{ $t('split-test.title') }}</h1>

    <!-- Секция с общими переводами -->
    <section class="common-section">
      <h2>{{ $t('split-test.common.section_title') }}</h2>
      <p>{{ $t('split-test.common.description') }}</p>
      <div class="features">
        <div
          v-for="i in 5"
          :key="i"
          class="feature"
        >
          <h3>{{ $t(`split-test.common.features.feature${i}.title`) }}</h3>
          <p>{{ $t(`split-test.common.features.feature${i}.description`) }}</p>
        </div>
      </div>
    </section>

    <!-- Секция с вложенными переводами -->
    <section class="nested-section">
      <h2>{{ $t('split-test.nested.section_title') }}</h2>
      <div class="nested-content">
        <div
          v-for="i in 3"
          :key="i"
          class="nested-item"
        >
          <h3>{{ $t(`split-test.nested.items.item${i}.title`) }}</h3>
          <p>{{ $t(`split-test.nested.items.item${i}.description`) }}</p>
          <ul>
            <li
              v-for="j in 3"
              :key="j"
            >
              {{ $t(`split-test.nested.items.item${i}.details.detail${j}`) }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Секция с префиксными переводами -->
    <section class="prefixed-section">
      <h2>{{ $t('split-test.prefixed.section_title') }}</h2>
      <div class="prefixed-content">
        <div
          v-for="prefix in ['header', 'footer', 'sidebar']"
          :key="prefix"
          class="prefixed-item"
        >
          <h3>{{ $t(`split-test.prefixed.${prefix}.title`) }}</h3>
          <p>{{ $t(`split-test.prefixed.${prefix}.description`) }}</p>
          <div
            v-for="i in 2"
            :key="i"
            class="prefixed-subitem"
          >
            <h4>{{ $t(`split-test.prefixed.${prefix}.items.item${i}.title`) }}</h4>
            <p>{{ $t(`split-test.prefixed.${prefix}.items.item${i}.description`) }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useNuxtApp } from '#imports'

const { $t } = useNuxtApp()

definePageMeta({
  title: 'Split Test Page',
  description: 'Page for testing split command functionality',
})
</script>

<style scoped>
.split-test {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

section {
  margin-bottom: 3rem;
  padding: 2rem;
  border: 1px solid #eee;
  border-radius: 8px;
}

.features, .nested-content, .prefixed-content {
  display: grid;
  gap: 2rem;
  margin-top: 1.5rem;
}

.feature, .nested-item, .prefixed-item {
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 6px;
}

.prefixed-subitem {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
}

ul {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-top: 0.5rem;
}
</style>
