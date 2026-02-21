import React from 'react'
import Users from './Users'
import Logout from './Logout'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthProvider'
import { useTheme } from '../../context/ThemeProvider'

const COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#8b5cf6']

const ThemeToggle = () => {
  const { dark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light' : 'Switch to dark'}
      className="w-8 h-8 flex items-center justify-center rounded-full transition"
      style={{ color: dark ? '#94a3b8' : '#64748b', background: 'transparent' }}
      onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {dark ? (
        /* sun */
        <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"/>
          <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        /* moon */
        <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      )}
    </button>
  )
}

const Left = () => {
  const [AuthUser] = useAuth()
  const { dark } = useTheme()
  const initials = AuthUser?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'Me'
  const color = COLORS[(AuthUser?.fullName?.charCodeAt(0) || 0) % COLORS.length]

  // Theme tokens
  const panelBg    = dark ? '#111827' : '#ffffff'
  const headerBg   = dark ? '#1e2433' : '#f8faff'   // top bar: just a whisper of blue-grey in light
  const headerBorder = dark ? '#2a3347' : '#e8edf8'
  const titleColor = dark ? '#f1f5f9' : '#0f172a'
  const chipBg     = dark ? '#1a2235' : '#eef2ff'   // indigo tint for Me chip
  const chipBorder = dark ? '#2a3347' : '#dde5ff'
  const meNameColor = dark ? '#e2e8f0' : '#1e293b'
  const editColor  = dark ? '#4b5563' : '#94a3b8'
  const editHover  = dark ? '#9ca3af' : '#6366f1'
  const onlineDotBorder = dark ? '#1a2235' : '#eef2ff'

  return (
    <div
      className="flex flex-col w-full h-full border-r"
      style={{ background: panelBg, borderColor: dark ? '#1e2a3a' : '#e2e8f0' }}
    >
      {/* ── Top bar — slightly different from panel body ── */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 border-b"
        style={{ background: headerBg, borderColor: headerBorder }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <span className="text-[14px] font-bold tracking-tight" style={{ color: titleColor }}>NexChat</span>
        </div>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <Link to="/profile"
            className="w-8 h-8 flex items-center justify-center rounded-full transition"
            style={{ color: dark ? '#64748b' : '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'; e.currentTarget.style.color = dark ? '#e2e8f0' : '#6366f1' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dark ? '#64748b' : '#94a3b8' }}>
            <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </Link>
          <Logout />
        </div>
      </div>

      {/* ── Me chip — same header zone color, pill card ── */}
      <div
        className="mx-3 my-2.5 flex items-center gap-2.5 rounded-xl px-3 py-2 border"
        style={{ background: chipBg, borderColor: chipBorder }}
      >
        <div className="relative flex-shrink-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: color }}
          >
            {initials}
          </div>
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full border"
            style={{ borderColor: onlineDotBorder }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold truncate leading-none mb-0.5" style={{ color: meNameColor }}>Me</p>
          <p className="text-[10px] font-semibold text-emerald-500">Online</p>
        </div>
        <Link to="/profile"
          className="text-[10px] font-semibold transition"
          style={{ color: editColor }}
          onMouseEnter={e => e.currentTarget.style.color = editHover}
          onMouseLeave={e => e.currentTarget.style.color = editColor}
        >Edit</Link>
      </div>

      {/* ── Contact list (plain panel background) ── */}
      <Users />
    </div>
  )
}

export default Left
