<template>
  <article class="interactive-fixture-card">
    <header>
      <h4>{{ title }}</h4>
      <p>{{ subtitle }}</p>
    </header>

    <p>{{ description }}</p>

    <footer>
      <button @click="emit('confirm')">
        Confirm action
      </button>
      <button @click="emit('cancel')">
        Cancel action
      </button>
    </footer>
  </article>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  description?: string
}>(), {
  title: 'Fixture card title',
  subtitle: 'Subtitle for QA checks',
  description: 'This card exists to provide extra static text cases for extract/search flows.',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { title, subtitle, description } = toRefs(props)
</script>
