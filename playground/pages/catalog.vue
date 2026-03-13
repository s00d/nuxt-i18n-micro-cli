<template>
  <div>
    <h1>{{ $t('catalog.hero') }}</h1>
    <p>{{ $t('catalog.description') }}</p>
    <ul>
      <li>{{ $t('catalog.details.shipping') }}</li>
      <li>{{ $t('catalog.details.returns') }}</li>
    </ul>
    <p><strong>Layer active:</strong> {{ $t('layerMeta.active') }}</p>
    <p><strong>Layer root-only:</strong> {{ $t('layerMeta.rootOnly') }}</p>
  </div>
</template>
