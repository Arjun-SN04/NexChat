import React, { createContext, useContext, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

const ThemeProvider = ({ children }) => {
  // Dark by default; light only if the visitor chose it
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('chatTheme') !== 'light' } catch { return true }
  })
  const toggle = () => setDark(d => {
    localStorage.setItem('chatTheme', !d ? 'dark' : 'light')
    return !d
  })
  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
