<template>
  <section class="dynamic-key-fixture">
    <h3>Dynamic Key Fixture</h3>
    <p>{{ $t(dynamicKey) }}</p>
    <p>{{ $t(`catalog.${suffix}`) }}</p>
    <p>{{ $t('landing.title') }}</p>
    <p>Fallback plain label for dynamic key demo</p>
  </section>
</template>

<script setup lang="ts">
const dynamicKey = ref('landing.subtitle')
const suffix = ref('description')
</script>
