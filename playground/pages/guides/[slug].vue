<template>
  <main>
    <h1>{{ $t('guides.title') }}</h1>
    <p><strong>Slug:</strong> {{ route.params.slug }}</p>
    <p>{{ $t('guides.p1') }}</p>
    <p>{{ $t('guides.p2') }}</p>
    <p>{{ $t('guides.p3') }}</p>
    <p>{{ $t('guides.p4') }}</p>

    <h2>Raw Lorem (no translation)</h2>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    </p>
    <p>
      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
