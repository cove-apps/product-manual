import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import type { Theme } from 'vitepress'
import HomeSearch from './components/HomeSearch.vue'
import DownloadButton from './components/DownloadButton.vue'
import FaqTabs from './components/FaqTabs.vue'
import FaqOutline from './components/FaqOutline.vue'
import HeroLogo from './components/HeroLogo.vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(DownloadButton),
      'home-hero-image': () => h(HeroLogo),
      'aside-top': () => h(FaqOutline),
    })
  },
  enhanceApp({ app }) {
    app.component('HomeSearch', HomeSearch)
    app.component('FaqTabs', FaqTabs)
  },
} satisfies Theme
