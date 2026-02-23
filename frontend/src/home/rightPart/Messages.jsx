import React, { useEffect, useRef } from 'react'
import Message from './Message'
import useGetMessages from '../../context/useGetMessages.js'
import useListenMessages from '../../context/useListenMessages.js'
import { useTheme } from '../../context/ThemeProvider'

// ── Returns "Today", "Yesterday", or "DD MMM YYYY" ──
const getDateLabel = (dateStr) => {
  const msgDate = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (isSameDay(msgDate, today)) return 'Today'
  if (isSameDay(msgDate, yesterday)) return 'Yesterday'

  return msgDate.toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── Date separator pill ──
const DateSeparator = ({ label, dark }) => (
  <div className="flex items-center gap-3 my-4 px-2">
    <div className="flex-1 h-px" style={{ background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
    <span
      className="text-[10px] font-semibold px-3 py-1 rounded-full select-none whitespace-nowrap tracking-wide"
      style={{
        background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        color: dark ? '#475569' : '#94a3b8',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
      }}
    >
      {label}
    </span>
    <div className="flex-1 h-px" style={{ background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
  </div>
)

const Messages = () => {
  const { loading, messages } = useGetMessages()
  useListenMessages()
  const { dark } = useTheme()
  const bottomRef = useRef(null)

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages])

  // Group messages and inject date separators
  const renderWithSeparators = () => {
    const items = []
    let lastLabel = null

    messages.forEach((message) => {
      const label = getDateLabel(message.createdAt)
      if (label !== lastLabel) {
        items.push(
          <DateSeparator key={`sep-${message._id}`} label={label} dark={dark} />
        )
        lastLabel = label
      }
      items.push(<Message key={message._id} messages={message} />)
    })

    return items
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 h-full">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length > 0 ? (
        renderWithSeparators()
      ) : (
        <div className="flex flex-col items-center justify-center h-full select-none">
          <p className="text-3xl mb-2">💬</p>
          <p className="text-[13px] font-semibold" style={{ color: dark ? '#475569' : '#64748b' }}>No messages yet</p>
          <p className="text-[11px] mt-0.5" style={{ color: dark ? '#374151' : '#94a3b8' }}>Say something to get started</p>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

export default Messages
