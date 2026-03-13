<template>
  <section class="hardcoded-audit-block">
    <h3>Hardcoded Audit Fixture</h3>
    <p>
      This paragraph is intentionally not localized to stress-test
      hardcoded text detection in Vue templates.
    </p>
    <p>
      Второй абзац тоже оставлен без перевода, чтобы команды поиска могли
      находить смешанный контент на нескольких языках.
    </p>
    <ul>
      <li>Raw list item one</li>
      <li>Raw list item two</li>
      <li>Raw list item three</li>
    </ul>
    <button title="Run hardcoded scan now">
      Start scan
    </button>
  </section>
</template>
