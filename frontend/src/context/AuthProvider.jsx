import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

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

  // If the login cookie is missing or expired, the API answers 401.
  // Drop the saved user so the app goes back to the login screen.
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (error) => {
        const url = error.config?.url || ''
        const isAuthCall = /\/user\/(login|signup)/.test(url)
        if (error.response?.status === 401 && !isAuthCall) {
          localStorage.removeItem('chatUser')
          setAuthUser(null)
        }
        return Promise.reject(error)
      }
    )
    return () => axios.interceptors.response.eject(id)
  }, [])

  // Refresh my saved profile from the server once per load (e.g. new username)
  useEffect(() => {
    if (!readStoredUser()) return
    axios.get('/api/user/me', { withCredentials: true })
      .then((res) => {
        localStorage.setItem('chatUser', JSON.stringify(res.data))
        setAuthUser(res.data)
      })
      .catch(() => { /* a 401 is handled by the interceptor above */ })
  }, [])

  return (
    <AuthContext.Provider value={[AuthUser, setAuthUser]}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider

export const useAuth = () => useContext(AuthContext)
