import React, { createContext, useContext, useState } from 'react'

export const AuthContext = createContext()

const AuthProvider = ({ children }) => {
  const stored = localStorage.getItem('chatUser')
  const [AuthUser, setAuthUser] = useState(stored ? JSON.parse(stored) : null)

  return (
    <AuthContext.Provider value={[AuthUser, setAuthUser]}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider

export const useAuth = () => useContext(AuthContext)
