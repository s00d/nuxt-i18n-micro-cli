<template>
  <main>
    <h2>{{ $t('admin.users.title') }}</h2>
    <p>{{ $t('admin.users.description') }}</p>
  </main>
</template>

<script setup lang="ts">
const cta = $t('admin.users.cta')
void cta
</script>
