import { ref, watchEffect } from 'vue'

const DARK_MODE_KEY = 'sinan-dark-mode'

const isDark = ref(false)

const initDarkMode = () => {
  const stored = localStorage.getItem(DARK_MODE_KEY)
  if (stored !== null) {
    isDark.value = stored === 'true'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  updateHtmlClass(isDark.value)
}

const updateHtmlClass = (dark: boolean) => {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const useDarkMode = () => {
  initDarkMode()

  const toggleDarkMode = () => {
    isDark.value = !isDark.value
    localStorage.setItem(DARK_MODE_KEY, String(isDark.value))
    updateHtmlClass(isDark.value)
  }

  const setDarkMode = (dark: boolean) => {
    isDark.value = dark
    localStorage.setItem(DARK_MODE_KEY, String(dark))
    updateHtmlClass(dark)
  }

  watchEffect(() => {
    updateHtmlClass(isDark.value)
  })

  return {
    isDark,
    toggleDarkMode,
    setDarkMode
  }
}