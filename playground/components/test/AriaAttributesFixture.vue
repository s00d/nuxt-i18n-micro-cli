<template>
  <section class="aria-attributes-fixture">
    <h3>ARIA and Attribute Fixture</h3>

    <button
      aria-label="Open settings panel"
      title="Open settings"
      data-test="open-settings-btn"
    >
      Open Settings
    </button>

    <input
      aria-label="Search in catalog"
      placeholder="Type your query here"
      name="catalog-search"
      type="text"
    >

    <a
      aria-label="Go to support center"
      title="Support center"
      href="#"
    >
      Contact Support
    </a>
  </section>
</template>
