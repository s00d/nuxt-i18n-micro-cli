<template>
  <div class="custom-component">
    <h2>Это кастомный компонент</h2>

    <section class="message">
      <h3>Сообщение компонента</h3>
      <p>{{ message }}</p>
    </section>

    <section class="details">
      <h3>Что делает этот компонент?</h3>
      <ul>
        <li>Отображает сообщение, переданное внутри компонента.</li>
        <li>Позволяет легко вставлять текстовые данные и логику в разные части вашего приложения.</li>
        <li>Простой пример использования Vue.js для создания повторяющихся элементов.</li>
      </ul>
    </section>

    <section class="example">
      <h3>Пример текстового контента</h3>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vel lectus dui. Morbi faucibus, metus ac
        pharetra scelerisque, ligula eros iaculis turpis, nec auctor justo augue sed justo. In varius quam vitae sem
        tincidunt, in lobortis lorem tincidunt.
      </p>
    </section>

    <section class="quote">
      <h4>Цитата</h4>
      <blockquote>
        «Мудрость начинается с восхищения.»
        <footer>- Сократ</footer>
      </blockquote>
    </section>

    <section class="code">
      <h4>Пример кода внутри компонента</h4>
      <pre><code>
const message = 'Текст внутри Vue компонента';
      </code></pre>
    </section>
  </div>
</template>

<script setup>
const message = 'Текст внутри Vue компонента'
</script>

<style scoped>
.custom-component {
  background-color: #ecf0f1;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

h2 {
  color: #2c3e50;
}

section {
  margin: 15px 0;
}

h3, h4 {
  color: #34495e;
}

ul {
  list-style-type: square;
  margin-left: 20px;
}

blockquote {
  font-style: italic;
  margin: 15px 0;
  padding-left: 20px;
  border-left: 4px solid #3498db;
}

pre {
  background-color: #34495e;
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 1.1em;
  margin: 10px 0;
}
</style>
