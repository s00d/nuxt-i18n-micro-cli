<template>
  <div>
    <h1>Fixtures Playground</h1>
    <p>
      This page contains dedicated component fixtures for i18n tooling tests
      (`search`, `text-to-i18n`, `extract`, `lint`).
    </p>

    <p>
      <i18n-link :to="{ name: 'index' }">
        Back to Home
      </i18n-link>
    </p>

    <hr>

    <h2>Component Fixtures</h2>
    <HardcodedAuditBlock />
    <MixedI18nAuditBlock />
    <InteractiveFixtureCard @confirm="handleFixtureConfirm" />
    <TemplateLiteralFixture />
    <AriaAttributesFixture />
    <DynamicKeyFixture />
  </div>
</template>

<script setup>
function handleFixtureConfirm() {
  console.log('InteractiveFixtureCard emitted confirm from fixtures page')
}
</script>
