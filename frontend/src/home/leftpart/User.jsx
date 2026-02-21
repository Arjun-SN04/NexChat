import React from 'react'
import useConversation from '../../Zustand/UserConversation'
import { useSocket } from '../../context/SocketProvider'
import { useTheme } from '../../context/ThemeProvider'

const COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#8b5cf6']

const User = ({ user }) => {
  const { selectedConversation, setSelectedConversation } = useConversation()
  const { onlineUsers } = useSocket()
  const { dark } = useTheme()
  const isSelected = selectedConversation?._id === user._id
  const isOnline = onlineUsers.includes(user._id)

  const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const color = COLORS[(user.fullName?.charCodeAt(0) || 0) % COLORS.length]

  const selectedBg  = dark ? '#1e2d47' : '#eff2ff'
  const hoverBg     = dark ? '#161f30' : '#f8f9ff'
  const nameColor   = dark ? (isSelected ? '#a5b4fc' : '#cbd5e1') : (isSelected ? '#4f46e5' : '#1e293b')
  const dotBorder   = dark ? '#111827' : '#ffffff'

  return (
    <div
      onClick={() => setSelectedConversation(user)}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-100 mb-0.5"
      style={{ background: isSelected ? selectedBg : 'transparent' }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = hoverBg }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
          style={{ background: color }}>
          {initials}
        </div>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2"
            style={{ borderColor: dotBorder }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate leading-none mb-0.5" style={{ color: nameColor }}>
          {user.fullName}
        </p>
        <p className="text-[11px] truncate" style={{ color: isOnline ? '#10b981' : (dark ? '#475569' : '#94a3b8') }}>
          {isOnline ? 'Online' : user.email}
        </p>
      </div>

      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
    </div>
  )
}

export default User
