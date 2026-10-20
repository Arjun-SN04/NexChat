import React, { createContext, useContext, useState } from 'react'

export const AuthContext = createContext()

// Older versions saved the password hash in the browser; strip it out.
const readStoredUser = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('chatUser'))
    if (!stored) return null
    if ('password' in stored || 'confirmPassword' in stored) {
      delete stored.password
      delete stored.confirmPassword
      localStorage.setItem('chatUser', JSON.stringify(stored))
    }
    return stored
  } catch {
    return null
  }
}

const AuthProvider = ({ children }) => {
  const [AuthUser, setAuthUser] = useState(readStoredUser)

  return (
    <AuthContext.Provider value={[AuthUser, setAuthUser]}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider

export const useAuth = () => useContext(AuthContext)
