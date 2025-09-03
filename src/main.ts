import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import {router} from './router.ts'

const DARK_MODE_KEY = 'sinan-dark-mode'
const stored = localStorage.getItem(DARK_MODE_KEY)
if (stored !== null) {
  if (stored === 'true') {
    document.documentElement.classList.add('dark')
  }
} else {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark')
  }
}

createApp(App)
    .use(router)
    .mount('#app')
