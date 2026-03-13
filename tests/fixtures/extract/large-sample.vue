<template>
  <section>
    <!-- $t('hidden.in.comment') -->
    <h1>{{ $t("dashboard.title") }}</h1>
    <p>{{ $t(
      'dashboard.subtitle'
    ) }}</p>
    <button :title="$t('button.tooltip')">{{ $t("button.label") }}</button>
    <span>{{ count > 1 ? $tc('items.count', count) : $t('items.single') }}</span>
  </section>
</template>

<script setup lang="ts">
const count = 2
const footer = $t('footer.text')
const multiline = $t(
  'footer.multiline',
)
const many = $tc(
  'footer.plural',
  count,
)
</script>
