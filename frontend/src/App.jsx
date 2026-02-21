import React, { useState, useCallback, useRef, useEffect } from 'react'
import Left from './home/leftpart/Left'
import Right from './home/rightPart/Right'
import Signup from './components/Signup'
import Login from './components/Login'
import HomePage from './components/HomePage'
import Profile from './components/Profile'
import { useAuth } from './context/AuthProvider'
import { useTheme } from './context/ThemeProvider'
import { Navigate, Route, Routes } from 'react-router-dom'
import useConversation from './Zustand/UserConversation'

// ── Constants ──────────────────────────────────────────────
const MIN_LEFT_PX  = 220   // sidebar can't go narrower than this
const MAX_LEFT_PX  = 480   // sidebar can't go wider than this
const DEFAULT_LEFT = 280   // default sidebar width

// ── Resizable Chat Layout ───────────────────────────────────
const ChatLayout = () => {
  const { dark } = useTheme()
  const { selectedConversation } = useConversation()

  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem('chatLeftWidth')
    return saved ? parseInt(saved, 10) : DEFAULT_LEFT
  })

  const isDragging   = useRef(false)
  const startX       = useRef(0)
  const startWidth   = useRef(0)
  const containerRef = useRef(null)
  const dividerRef   = useRef(null)

  // ── Drag handlers ──────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    isDragging.current  = true
    startX.current      = e.clientX
    startWidth.current  = leftWidth
    document.body.style.cursor    = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [leftWidth])

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return
    const delta   = e.clientX - startX.current
    const newWidth = Math.min(MAX_LEFT_PX, Math.max(MIN_LEFT_PX, startWidth.current + delta))
    setLeftWidth(newWidth)
  }, [])

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current            = false
    document.body.style.cursor    = ''
    document.body.style.userSelect = ''
    // persist preference
    localStorage.setItem('chatLeftWidth', String(leftWidth))
  }, [leftWidth])

  // Touch support
  const onTouchStart = useCallback((e) => {
    isDragging.current = true
    startX.current     = e.touches[0].clientX
    startWidth.current = leftWidth
  }, [leftWidth])

  const onTouchMove = useCallback((e) => {
    if (!isDragging.current) return
    const delta    = e.touches[0].clientX - startX.current
    const newWidth = Math.min(MAX_LEFT_PX, Math.max(MIN_LEFT_PX, startWidth.current + delta))
    setLeftWidth(newWidth)
  }, [])

  const onTouchEnd = useCallback(() => {
    isDragging.current = false
    localStorage.setItem('chatLeftWidth', String(leftWidth))
  }, [leftWidth])

  // Attach global listeners
  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend',  onTouchEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend',  onTouchEnd)
    }
  }, [onMouseMove, onMouseUp, onTouchMove, onTouchEnd])

  // Double-click divider → reset to default
  const onDoubleClick = useCallback(() => {
    setLeftWidth(DEFAULT_LEFT)
    localStorage.setItem('chatLeftWidth', String(DEFAULT_LEFT))
  }, [])

  const dividerColor  = dark ? '#2a3347' : '#e2e8f0'
  const dividerHover  = dark ? '#4f46e5' : '#6366f1'
  const handleColor   = dark ? '#374151' : '#cbd5e1'

  return (
    <div
      ref={containerRef}
      className='flex overflow-hidden'
      style={{ background: dark ? '#0f172a' : '#eef1f8', height: '100dvh' }}
    >
      {/* ── LEFT PANEL ── */}
      <div
        className={`
          flex-shrink-0 flex-col h-full
          ${selectedConversation ? 'hidden md:flex' : 'flex w-full md:w-auto'}
        `}
        style={{ width: selectedConversation ? `${leftWidth}px` : undefined }}
      >
        <Left />
      </div>

      {/* ── DIVIDER ── (only on md+) */}
      <div
        ref={dividerRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onDoubleClick={onDoubleClick}
        title="Drag to resize · Double-click to reset"
        className="hidden md:flex flex-col items-center justify-center flex-shrink-0 relative group"
        style={{
          width: '6px',
          cursor: 'col-resize',
          background: 'transparent',
          zIndex: 10,
        }}
      >
        {/* The visible thin line */}
        <div
          className="w-px h-full absolute inset-0 mx-auto transition-all duration-150 group-hover:w-[3px] group-active:w-[3px]"
          style={{
            background: dividerColor,
            transition: 'background 0.15s, width 0.15s',
          }}
        />

        {/* Drag handle pill — centered vertically */}
        <div
          className="relative z-10 flex flex-col gap-[3px] items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-full px-0.5 py-2"
          style={{
            background: dark ? '#1e2433' : '#f8faff',
            border: `1px solid ${dividerColor}`,
            boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.10)',
          }}
        >
          {[0,1,2].map(i => (
            <div
              key={i}
              className="w-0.5 h-3 rounded-full"
              style={{ background: handleColor }}
            />
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className={`
          flex-col h-full overflow-hidden
          ${selectedConversation ? 'flex flex-1 w-full' : 'hidden md:flex md:flex-1'}
        `}
      >
        <Right />
      </div>
    </div>
  )
}

// ── App ─────────────────────────────────────────────────────
const App = () => {
  const [AuthUser] = useAuth()

  return (
    <Routes>
      <Route path='/home' element={<HomePage />} />
      <Route
        path='/'
        element={AuthUser ? <ChatLayout /> : <Navigate to="/home" />}
      />
      <Route path='/signup' element={AuthUser ? <Navigate to="/" /> : <Signup />} />
      <Route path='/login'  element={AuthUser ? <Navigate to="/" /> : <Login />} />
      <Route path='/profile' element={AuthUser ? <Profile /> : <Navigate to="/login" />} />
    </Routes>
  )
}

export default App
