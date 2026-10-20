import { useEffect, useRef, useState } from 'react'
import Left from './leftpart/Left'
import Right from './rightPart/Right'
import useConversation from '../Zustand/UserConversation'
import useThemeClass from '../hooks/useThemeClass'
import useListenMessages from '../context/useListenMessages'
import usePageTitle from '../hooks/usePageTitle'
import { loadConversations, markSeen } from '../utils/conversations'

const MIN_WIDTH = 280
const MAX_WIDTH = 440
const DEFAULT_WIDTH = 330

const readSavedWidth = () => {
  try {
    const saved = parseInt(localStorage.getItem('chatLeftWidth'), 10)
    return saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_WIDTH
  } catch {
    return DEFAULT_WIDTH
  }
}

const ChatLayout = () => {
  useThemeClass()
  const { selectedConversation, unreadCounts, clearUnread } = useConversation()

  // Listen for socket events for the whole chat screen, so unread badges
  // update even when no conversation is open.
  useListenMessages()

  // Sidebar previews + unread counts from the server
  useEffect(() => { loadConversations() }, [])

  // Opening a chat marks it as read (and again when you come back to the tab)
  const openId = selectedConversation?._id
  useEffect(() => {
    if (!openId) return
    clearUnread(openId)
    markSeen(openId)
    const onVisible = () => document.visibilityState === 'visible' && markSeen(openId)
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [openId, clearUnread])

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0)
  const title = selectedConversation?.fullName || 'Chats'
  usePageTitle(totalUnread ? `(${totalUnread}) ${title}` : title)

  // Resizable sidebar (desktop only)
  const [width, setWidth] = useState(readSavedWidth)
  const drag = useRef(null)

  useEffect(() => {
    try { localStorage.setItem('chatLeftWidth', String(width)) } catch { /* ignore */ }
  }, [width])

  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, w: width }
    e.currentTarget.setPointerCapture(e.pointerId)
    document.body.style.userSelect = 'none'
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, drag.current.w + e.clientX - drag.current.x)))
  }
  const onPointerUp = () => {
    drag.current = null
    document.body.style.userSelect = ''
  }

  return (
    <div>
      <div className="flex h-dvh overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <aside
          className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full shrink-0 md:w-(--sidebar-w)`}
          style={{ '--sidebar-w': `${width}px` }}
        >
          <Left />
        </aside>

        {/* Resize handle */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
          title="Drag to resize · double-click to reset"
          className="group relative hidden w-px shrink-0 cursor-col-resize bg-slate-200 md:block dark:bg-slate-800"
        >
          <div className="absolute inset-y-0 -left-2 -right-2 z-10" />
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <main className={`${selectedConversation ? 'flex' : 'hidden md:flex'} min-w-0 flex-1`}>
          <Right />
        </main>
      </div>
    </div>
  )
}

export default ChatLayout
