<template>
  <section>
    <!-- $t('home.hidden.comment') -->
    <h1>{{ $t('home.title') }}</h1>
    <p>{{ $t(
      'home.subtitle',
    ) }}</p>
    <span>{{ $tc('home.items', itemsCount) }}</span>
  </section>
</template>

<script setup lang="ts">
const itemsCount = 3
const label = $t('home.script.label')
void label
</script>
