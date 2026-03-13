<template>
  <section class="template-literal-fixture">
    <h3>Template Literal Fixture</h3>
    <p>{{ plainMessage }}</p>
    <p>{{ multilineMessage }}</p>
    <p>{{ mixedMessage }}</p>
  </section>
</template>

<script setup lang="ts">
const plainMessage = `This string comes from a template literal and should be treated as hardcoded text.`

const multilineMessage = `
This is a multiline literal used for parser stress checks.
It intentionally contains a lot of plain text without i18n wrappers.
`

const mixedMessage = `Status: ${'ready'} - still not localized`
</script>
