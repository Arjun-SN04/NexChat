import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => localStorage.getItem('chatTheme') === 'dark')
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
