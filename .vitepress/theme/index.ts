import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import HomeSearch from './components/HomeSearch.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeSearch', HomeSearch)
  },
} satisfies Theme
