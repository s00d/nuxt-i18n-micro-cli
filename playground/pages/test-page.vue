<template>
  <div>
    <h1>Привет, мир! Добро пожаловать!</h1>

    <section class="intro">
      <h2>Введение в тестовую страницу</h2>
      <p>
        Это тестовая страница, которая демонстрирует базовые возможности Vue и использование различных компонентов.
        Мы хотим показать, как можно красиво оформлять текст и использовать разные форматы.
      </p>
    </section>

    <section class="details">
      <h3>Что мы видим на странице?</h3>
      <ul>
        <li>Заголовок первого уровня</li>
        <li>Текст с параграфами</li>
        <li>Кнопка, которая вызывает событие при нажатии</li>
        <li>Пример кастомного компонента</li>
      </ul>
    </section>

    <section class="highlight">
      <h3>Особенности компонентов</h3>
      <p>
        На этой странице используется компонент <code>CustomComponent</code>, который позволяет организовывать
        повторяющиеся элементы в одном месте, что делает код более чистым и удобным для поддержки.
      </p>
    </section>

    <section class="example">
      <h4>Пример текстового контента</h4>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nec dictum urna. Vivamus scelerisque erat vitae
        neque scelerisque, ac cursus lorem rhoncus. Integer vitae varius velit. Phasellus bibendum, mauris sed tempus
        scelerisque, odio turpis vehicula velit, vel condimentum libero sem nec tortor.
      </p>
      <p>
        Duis dictum purus at velit mollis, eget interdum turpis scelerisque. Sed tristique massa ac eros gravida, non
        pretium nisi vestibulum. Nunc eget orci eu odio convallis posuere ut in sapien. Vivamus gravida leo sed nisi
        vestibulum, non efficitur turpis auctor.
      </p>
    </section>

    <section class="interactive">
      <h3>Интерактивность</h3>
      <p>Нажмите кнопку ниже, чтобы увидеть пример текстового вывода:</p>
      <button @click="showMessage('Пример текста: Вы только что нажали на кнопку!')">Нажми сюда</button>
      <button @click="showMessage2()">Нажми сюда</button>
    </section>

    <custom-component />

    <section class="quotes">
      <h3>Цитаты</h3>
      <blockquote>
        «Жизнь — это не то, что с тобой происходит, а то, как ты на это реагируешь.»
        <footer>- Эпиктет</footer>
      </blockquote>
      <blockquote>
        «Будущее принадлежит тем, кто верит в красоту своих мечтаний.»
        <footer>- Элеонора Рузвельт</footer>
      </blockquote>
    </section>

    <CustomComponent />

    <section class="table">
      <h3>Таблица</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Возраст</th>
            <th>Город</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Иван</td>
            <td>30</td>
            <td>Москва</td>
          </tr>
          <tr>
            <td>Мария</td>
            <td>25</td>
            <td>Санкт-Петербург</td>
          </tr>
          <tr>
            <td>Алексей</td>
            <td>35</td>
            <td>Новосибирск</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="code-example">
      <h3>Пример кода</h3>
      <pre><code>
function showMessage(message) {
  alert(message);
}
      </code></pre>
    </section>
  </div>
</template>

<script setup>
import CustomComponent from '~/components/CustomComponent.vue'

function showMessage(message) {
  alert(message)
}
function showMessage2() {
  alert('Пример текста 2: Вы только что нажали на кнопку!')
}
</script>

<style scoped>
h1 {
  color: #2c3e50;
  text-align: center;
}

section {
  margin: 20px 0;
}

h2, h3, h4 {
  color: #34495e;
}

.intro, .details, .highlight, .example, .interactive, .quotes, .table, .code-example {
  background-color: #ecf0f1;
  padding: 15px;
  border-radius: 5px;
}

button {
  padding: 10px 15px;
  background-color: #3498db;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}

button:hover {
  background-color: #2980b9;
}

blockquote {
  font-style: italic;
  margin: 20px 0;
  padding-left: 20px;
  border-left: 4px solid #3498db;
}

table {
  width: 100%;
  margin-top: 20px;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  text-align: left;
}

th {
  background-color: #3498db;
  color: white;
}
</style>
