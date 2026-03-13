<template>
  <!-- $t('commented.key') -->
  <div>{{ $t("visible.key") }}</div>
</template>

<script setup lang="ts">
const title = $t(
  'multiline.key',
)
const count = 2
const plural = $tc('items.count', count)
</script>
