<template>
  <section class="mixed-i18n-audit-block">
    <h3>{{ $t('landing.title') }}</h3>
    <p>{{ $t('landing.subtitle') }}</p>

    <p><strong>Manual label:</strong> {{ $t('layerMeta.active') }}</p>
    <p><strong>Untranslated marker:</strong> Keep this sentence as hardcoded text.</p>

    <div>
      <span>Static badge text</span>
      <span>{{ $t('layerMeta.base') }}</span>
    </div>
  </section>
</template>
