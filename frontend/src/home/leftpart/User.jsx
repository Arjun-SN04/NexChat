import React from 'react'
import useConversation from '../../Zustand/UserConversation'
import { useSocket } from '../../context/SocketProvider'
import { useTheme } from '../../context/ThemeProvider'

const COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#8b5cf6']

const User = ({ user }) => {
  const { selectedConversation, setSelectedConversation, unreadCounts, clearUnread } = useConversation()
  const { onlineUsers } = useSocket()
  const { dark } = useTheme()

  const isSelected = selectedConversation?._id === user._id
  const isOnline   = onlineUsers.includes(user._id)
  const unread     = unreadCounts[user._id] || 0

  const initials  = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const color     = COLORS[(user.fullName?.charCodeAt(0) || 0) % COLORS.length]

  const selectedBg = dark ? '#1e2d47' : '#eff2ff'
  const hoverBg    = dark ? '#161f30' : '#f8f9ff'
  const nameColor  = dark
    ? (isSelected ? '#a5b4fc' : '#cbd5e1')
    : (isSelected ? '#4f46e5' : '#1e293b')
  const dotBorder  = dark ? '#111827' : '#ffffff'

  const handleClick = () => {
    setSelectedConversation(user)
    if (unread > 0) clearUnread(user._id)
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-100 mb-0.5"
      style={{ background: isSelected ? selectedBg : 'transparent' }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = hoverBg }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
          style={{ background: color }}
        >
          {initials}
        </div>

        {/* Online dot */}
        {isOnline && (
          <span
            className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2"
            style={{ borderColor: dotBorder }}
          />
        )}
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate leading-none mb-0.5" style={{ color: nameColor }}>
          {user.fullName}
        </p>
        <p
          className="text-[11px] truncate"
          style={{ color: isOnline ? '#10b981' : (dark ? '#475569' : '#94a3b8') }}
        >
          {isOnline ? 'Online' : user.email}
        </p>
      </div>

      {/* Right side: unread badge OR selected dot */}
      <div className="flex-shrink-0 flex items-center justify-center w-5">
        {unread > 0 && !isSelected ? (
          /* Notification badge */
          <div
            className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-white font-black"
            style={{
              background: '#6366f1',
              fontSize: '10px',
              lineHeight: 1,
              boxShadow: '0 0 0 2px ' + (dark ? '#111827' : '#ffffff'),
              animation: 'pulse-badge 2s ease-in-out infinite',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </div>
        ) : isSelected ? (
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        ) : null}
      </div>
    </div>
  )
}

export default User
