import { useLayoutEffect } from 'react'
import { useTheme } from '../context/ThemeProvider'

// Apply the app's dark mode to the whole page (<html class="dark">) while the
// calling screen is mounted. Doing it on <html> (not a wrapper div) means
// pop-ups rendered into <body> — dialogs, image viewer, forward picker — follow
// the theme too. The landing and sign-in pages don't use this, so they stay light.
const useThemeClass = () => {
  const { dark } = useTheme()
  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
    return () => {
      root.classList.remove('dark')
      root.style.colorScheme = ''
    }
  }, [dark])
  return dark
}

export default useThemeClass
