import React, { useState } from 'react'
import useConversation from '../../Zustand/UserConversation'
import { useSocket } from '../../context/SocketProvider'
import { useTheme } from '../../context/ThemeProvider'
import axios from 'axios'

const COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#8b5cf6']

const ChatUser = ({ onBack }) => {
  const { selectedConversation, setMessages } = useConversation()
  const { onlineUsers } = useSocket()
  const { dark } = useTheme()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!selectedConversation) return null

  const isOnline = onlineUsers.includes(selectedConversation._id)
  const initials = selectedConversation.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const color = COLORS[(selectedConversation.fullName?.charCodeAt(0) || 0) % COLORS.length]

  const headerBg     = dark ? '#1e2433' : '#f8faff'
  const headerBorder = dark ? '#2a3347' : '#e8edf8'
  const nameColor    = dark ? '#f1f5f9' : '#0f172a'
  const dotBorder    = dark ? '#1e2433' : '#f8faff'
  const modalBg      = dark ? '#1e2433' : '#ffffff'
  const modalBorder  = dark ? '#2a3347' : '#e2e8f0'
  const cancelBg     = dark ? '#2a3347' : '#f1f5f9'
  const cancelColor  = dark ? '#94a3b8' : '#475569'

  const handleDeleteConversation = async () => {
    setDeleting(true)
    try {
      await axios.delete(`/api/message/conversation/${selectedConversation._id}`, { withCredentials: true })
      setMessages([])
      setShowConfirm(false)
    } catch (err) { console.log(err) }
    finally { setDeleting(false) }
  }

  return (
    <>
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b"
        style={{ background: headerBg, borderColor: headerBorder }}>
        <div className="flex items-center gap-2">
          {/* Back button — visible on mobile only */}
          <button
            onClick={onBack}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full mr-1 transition"
            style={{ color: dark ? '#94a3b8' : '#64748b' }}
            onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            title="Back to contacts"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <div className="relative">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
              style={{ background: color }}>
              {initials}
            </div>
            {isOnline && <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2"
              style={{ borderColor: dotBorder }} />}
          </div>
          <div>
            <h2 className="text-[13px] font-bold leading-none mb-0.5" style={{ color: nameColor }}>
              {selectedConversation.fullName}
            </h2>
            <p className="text-[11px] font-semibold"
              style={{ color: isOnline ? '#10b981' : (dark ? '#475569' : '#94a3b8') }}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        <button onClick={() => setShowConfirm(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition"
          style={{ color: dark ? '#475569' : '#94a3b8' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = dark ? 'rgba(239,68,68,0.08)' : '#fee2e2' }}
          onMouseLeave={e => { e.currentTarget.style.color = dark ? '#475569' : '#94a3b8'; e.currentTarget.style.background = 'transparent' }}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl shadow-2xl p-6 w-full max-w-xs border"
            style={{ background: modalBg, borderColor: modalBorder }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: dark ? 'rgba(239,68,68,0.1)' : '#fee2e2' }}>
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h3 className="text-[15px] font-black text-center mb-1" style={{ color: nameColor }}>Delete conversation?</h3>
            <p className="text-[12px] text-center mb-5 leading-relaxed" style={{ color: dark ? '#64748b' : '#94a3b8' }}>
              All messages will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 text-[12px] font-semibold rounded-xl transition"
                style={{ background: cancelBg, color: cancelColor }}>Cancel</button>
              <button onClick={handleDeleteConversation} disabled={deleting}
                className="flex-1 py-2 text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition disabled:opacity-50">
                {deleting ? 'Removing…' : 'Delete all'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatUser
