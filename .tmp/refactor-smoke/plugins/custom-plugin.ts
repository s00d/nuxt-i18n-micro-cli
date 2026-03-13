export default defineNuxtPlugin(() => {
  const russianMessage = 'Привет из плагина!'
  console.log(russianMessage)

  return {
    provide: {
      exampleFunction: () => {
        console.log('Пример русского текста: Это плагин Nuxt.')
      },
    },
  }
})
