import axios from 'axios'
import React, { useState } from 'react'
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthProvider'
import { useTheme } from '../../context/ThemeProvider'

const Logout = () => {
  const [loading, setLoading] = useState(false)
  const [, setAuthUser] = useAuth()
  const { dark } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    setLoading(true)
    try {
      await axios.post('/api/user/logout', {}, { withCredentials: true })
      localStorage.removeItem('chatUser')
      Cookies.remove('jwt')
      setAuthUser(null)
      navigate('/home')
    } catch (error) { console.log(error) }
    finally { setLoading(false) }
  }

  return (
    <button onClick={handleLogout} disabled={loading} title="Logout"
      className="w-8 h-8 flex items-center justify-center rounded-full transition"
      style={{ color: dark ? '#64748b' : '#94a3b8' }}
      onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dark ? '#64748b' : '#94a3b8' }}
    >
      {loading
        ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
        : <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
      }
    </button>
  )
}

export default Logout
