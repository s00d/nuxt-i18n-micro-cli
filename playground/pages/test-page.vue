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

    <section class="text-formatting">
      <h3>Форматирование текста</h3>
      <p><strong>Жирный текст</strong> и <b>альтернативный жирный текст</b></p>
      <p><em>Курсивный текст</em> и <i>альтернативный курсивный текст</i></p>
      <p><mark>Выделенный текст</mark></p>
      <p><small>Мелкий текст</small></p>
      <p><del>Зачеркнутый текст</del></p>
      <p><ins>Подчеркнутый текст</ins></p>
      <p>Текст с <sub>нижним</sub> и <sup>верхним</sup> индексом</p>
      <p><abbr title="Пример аббревиатуры">HTML</abbr></p>
      <p><dfn>Определение термина</dfn></p>
      <p><kbd>Ctrl</kbd> + <kbd>C</kbd></p>
      <p>Переменная <var>x</var> равна 10</p>
      <p><samp>Пример вывода программы</samp></p>
      <p><time datetime="2024-01-20">20 января 2024</time></p>
      <p lang="ru">Текст на русском языке</p>
      <bdi>Текст с двунаправленной изоляцией</bdi>
      <p><q>Короткая цитата в тексте</q></p>
      <p><u>Текст с подчеркиванием</u></p>
      <p><s>Неактуальный текст</s></p>
    </section>

    <section class="links">
      <h3>Полезные ссылки</h3>
      <nav>
        <ul>
          <li>
            <a
              href="#"
              title="Перейти на главную"
            >Главная страница</a>
          </li>
          <li>
            <a
              href="#"
              title="Узнать больше о нас"
            >О компании</a>
          </li>
          <li>
            <a
              href="#"
              title="Посмотреть наши услуги"
            >Услуги</a>
          </li>
          <li>
            <a
              href="#"
              title="Связаться с нами"
            >Контакты</a>
          </li>
          <li>
            <a
              href="mailto:info@example.com"
              title="Написать письмо"
            >Электронная почта</a>
          </li>
          <li>
            <a
              href="tel:+79001234567"
              title="Позвонить нам"
            >Телефон</a>
          </li>
        </ul>
      </nav>
    </section>

    <section class="lists">
      <h3>Списки</h3>
      <h4>Маркированный список</h4>
      <ul>
        <li>Первый пункт</li>
        <li>
          Второй пункт
          <ul>
            <li>Вложенный пункт 2.1</li>
            <li>Вложенный пункт 2.2</li>
          </ul>
        </li>
        <li>Третий пункт</li>
      </ul>

      <h4>Нумерованный список</h4>
      <ol>
        <li>Первый пункт</li>
        <li>
          Второй пункт
          <ol type="a">
            <li>Подпункт a</li>
            <li>Подпункт b</li>
          </ol>
        </li>
        <li>Третий пункт</li>
      </ol>

      <h4>Список определений</h4>
      <dl>
        <dt>Термин 1</dt>
        <dd>Определение термина 1</dd>
        <dt>Термин 2</dt>
        <dd>Определение термина 2</dd>
      </dl>
    </section>

    <section class="buttons">
      <h3>Примеры кнопок</h3>
      <div class="button-group">
        <button
          type="button"
          title="Сохранить изменения"
        >
          Сохранить
        </button>
        <button
          type="button"
          title="Отменить действие"
        >
          Отмена
        </button>
        <button
          type="submit"
          title="Отправить форму"
        >
          Отправить
        </button>
        <button
          type="reset"
          title="Сбросить форму"
        >
          Сбросить
        </button>
        <input
          type="button"
          value="Кнопка-input"
        >
        <input
          type="submit"
          value="Отправить-input"
        >
        <input
          type="reset"
          value="Сбросить-input"
        >
      </div>
    </section>

    <section class="forms">
      <h3>Элементы формы</h3>
      <form>
        <fieldset>
          <legend>Личные данные</legend>

          <div>
            <label for="name">Ваше имя:</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Введите ваше имя"
            >
          </div>

          <div>
            <label for="email">Email адрес:</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="example@domain.com"
            >
          </div>

          <div>
            <label for="phone">Телефон:</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="+7 (900) 123-45-67"
            >
          </div>

          <div>
            <label for="birthdate">Дата рождения:</label>
            <input
              id="birthdate"
              type="date"
              name="birthdate"
            >
          </div>

          <div>
            <label for="avatar">Фото профиля:</label>
            <input
              id="avatar"
              type="file"
              name="avatar"
              accept="image/*"
            >
          </div>

          <div>
            <label for="color">Любимый цвет:</label>
            <input
              id="color"
              type="color"
              name="color"
            >
          </div>

          <div>
            <label for="age">Возраст:</label>
            <input
              id="age"
              type="number"
              name="age"
              min="0"
              max="150"
            >
          </div>

          <div>
            <label for="satisfaction">Уровень удовлетворенности:</label>
            <input
              id="satisfaction"
              type="range"
              name="satisfaction"
              min="0"
              max="10"
            >
          </div>

          <div>
            <label for="search">Поиск:</label>
            <input
              id="search"
              type="search"
              name="search"
              placeholder="Поиск..."
            >
          </div>

          <div>
            <label for="url">Веб-сайт:</label>
            <input
              id="url"
              type="url"
              name="url"
              placeholder="https://example.com"
            >
          </div>

          <div>
            <label for="time">Время:</label>
            <input
              id="time"
              type="time"
              name="time"
            >
          </div>

          <div>
            <label for="month">Месяц:</label>
            <input
              id="month"
              type="month"
              name="month"
            >
          </div>

          <div>
            <label for="week">Неделя:</label>
            <input
              id="week"
              type="week"
              name="week"
            >
          </div>
        </fieldset>

        <fieldset>
          <legend>Дополнительная информация</legend>

          <div>
            <label for="message">Сообщение:</label>
            <textarea
              id="message"
              name="message"
              placeholder="Введите ваше сообщение"
              rows="4"
            />
          </div>

          <div>
            <label for="country">Страна:</label>
            <select
              id="country"
              name="country"
            >
              <optgroup label="Европа">
                <option value="ru">Россия</option>
                <option value="de">Германия</option>
                <option value="fr">Франция</option>
              </optgroup>
              <optgroup label="Азия">
                <option value="cn">Китай</option>
                <option value="jp">Япония</option>
                <option value="kr">Корея</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label>Интересы:</label>
            <div>
              <input
                id="interest1"
                type="checkbox"
                name="interests"
                value="sport"
              >
              <label for="interest1">Спорт</label>
            </div>
            <div>
              <input
                id="interest2"
                type="checkbox"
                name="interests"
                value="music"
              >
              <label for="interest2">Музыка</label>
            </div>
            <div>
              <input
                id="interest3"
                type="checkbox"
                name="interests"
                value="art"
              >
              <label for="interest3">Искусство</label>
            </div>
          </div>

          <div>
            <label>Пол:</label>
            <div>
              <input
                id="gender1"
                type="radio"
                name="gender"
                value="male"
              >
              <label for="gender1">Мужской</label>
            </div>
            <div>
              <input
                id="gender2"
                type="radio"
                name="gender"
                value="female"
              >
              <label for="gender2">Женский</label>
            </div>
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                name="agreement"
              >
              Я согласен с условиями использования
            </label>
          </div>
        </fieldset>
      </form>
    </section>

    <section class="interactive">
      <h3>Интерактивность</h3>
      <p>Нажмите кнопку ниже, чтобы увидеть пример текстового вывода:</p>
      <button @click="showMessage('Пример текста: Вы только что нажали на кнопку!')">Нажми сюда</button>
      <button @click="showMessage2()">Нажми сюда</button>
    </section>

    <section class="media">
      <h3>Медиа элементы</h3>
      <figure>
        <img
          src="placeholder.jpg"
          alt="Описание изображения"
          title="Подсказка при наведении"
        >
        <figcaption>Подпись к изображению</figcaption>
      </figure>

      <figure>
        <audio controls>
          <source
            src="audio.mp3"
            type="audio/mpeg"
          >
          Ваш браузер не поддерживает аудио элемент.
        </audio>
        <figcaption>Аудио пример</figcaption>
      </figure>

      <figure>
        <video
          controls
          width="400"
        >
          <source
            src="video.mp4"
            type="video/mp4"
          >
          Ваш браузер не поддерживает видео элемент.
        </video>
        <figcaption>Видео пример</figcaption>
      </figure>

      <picture>
        <source
          media="(min-width: 800px)"
          srcset="large.jpg"
        >
        <source
          media="(min-width: 400px)"
          srcset="medium.jpg"
        >
        <img
          src="small.jpg"
          alt="Адаптивное изображение"
        >
      </picture>

      <iframe
        src="about:blank"
        title="Встроенный фрейм"
        width="400"
        height="300"
      />
    </section>

    <section class="alerts">
      <h3>Информационные сообщения</h3>
      <div
        class="alert alert-info"
        role="alert"
      >
        Это информационное сообщение для пользователя
      </div>
      <div
        class="alert alert-success"
        role="alert"
      >
        Операция успешно завершена
      </div>
      <div
        class="alert alert-warning"
        role="alert"
      >
        Внимание! Проверьте введенные данные
      </div>
      <div
        class="alert alert-error"
        role="alert"
      >
        Ошибка! Что-то пошло не так
      </div>
    </section>

    <section class="quotes">
      <h3>Цитаты</h3>
      <blockquote cite="http://example.com">
        «Жизнь — это не то, что с тобой происходит, а то, как ты на это реагируешь.»
        <footer>- Эпиктет</footer>
      </blockquote>
      <blockquote cite="http://example.com">
        «Будущее принадлежит тем, кто верит в красоту своих мечтаний.»
        <footer>- Элеонора Рузвельт</footer>
      </blockquote>
    </section>

    <section class="tables">
      <h3>Таблицы</h3>
      <table>
        <caption>Список сотрудников</caption>
        <colgroup>
          <col style="background-color: #f0f0f0">
          <col>
          <col>
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Имя</th>
            <th scope="col">Возраст</th>
            <th scope="col">Город</th>
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
        <tfoot>
          <tr>
            <td colspan="3">Всего сотрудников: 3</td>
          </tr>
        </tfoot>
      </table>
    </section>

    <section class="progress">
      <h3>Индикаторы прогресса</h3>
      <progress
        value="70"
        max="100"
      >
        70%
      </progress>
      <meter value="0.6">60%</meter>
      <meter
        value="0.8"
        high="0.8"
        optimum="0.5"
      >
        80%
      </meter>
    </section>

    <section class="details-summary">
      <h3>Раскрывающиеся блоки</h3>
      <details>
        <summary>Нажмите, чтобы показать дополнительную информацию</summary>
        <p>Здесь находится скрытый текст, который появляется при клике на заголовок.</p>
      </details>
    </section>

    <section class="code-example">
      <h3>Пример кода</h3>
      <pre><code>
function showMessage(message) {
  alert(message);
}
      </code></pre>
    </section>

    <section class="math">
      <h3>Математические формулы</h3>
      <p>
        Формула квадратного уравнения:
        <var>x</var> = (-<var>b</var> ± √(<var>b</var>² - 4<var>ac</var>)) / (2<var>a</var>)
      </p>
    </section>

    <CustomComponent />

    <footer>
      <p>© <time>2024</time> Тестовый проект. Все права защищены.</p>
      <address>
        Адрес: г. Москва, ул. Примерная, д. 1<br>
        Email: <a href="mailto:info@example.com">info@example.com</a><br>
        Телефон: <a href="tel:+79001234567">+7 (900) 123-45-67</a>
      </address>
      <nav>
        <ul>
          <li>
            <a
              href="#"
              title="Правила использования"
            >Условия использования</a>
          </li>
          <li>
            <a
              href="#"
              title="Политика конфиденциальности"
            >Конфиденциальность</a>
          </li>
          <li>
            <a
              href="#"
              title="Помощь"
            >Поддержка</a>
          </li>
        </ul>
      </nav>
    </footer>
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
