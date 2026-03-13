<template>
  <main>
    <h1>{{ $t('docs.title') }}</h1>
    <p><strong>Section:</strong> {{ route.params.section }}</p>
    <p><strong>Page:</strong> {{ route.params.page }}</p>

    <p>{{ $t('docs.p1') }}</p>
    <p>{{ $t('docs.p2') }}</p>
    <p>{{ $t('docs.p3') }}</p>
    <p>{{ $t('docs.p4') }}</p>
    <p>{{ $t('docs.p5') }}</p>

    <h2>Raw Lorem Block</h2>
    <p>
      Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet.
      Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta.
    </p>
    <p>
      Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra,
      per inceptos himenaeos. Curabitur sodales ligula in libero.
    </p>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
