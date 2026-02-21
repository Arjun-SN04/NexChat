import React, { useState } from 'react'
import axios from 'axios'
import useConversation from '../../Zustand/UserConversation'
import { useTheme } from '../../context/ThemeProvider'

const Message = ({ messages }) => {
  const authUser = JSON.parse(localStorage.getItem('chatUser') || '{}')
  const itsMe = messages?.senderId?.toString() === authUser?._id?.toString()
  const { messages: allMessages, setMessages } = useConversation()
  const { dark } = useTheme()

  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(messages.message)
  const [deleting, setDeleting] = useState(false)

  if (!messages) return null

  const time = new Date(messages.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await axios.delete(`/api/message/delete/${messages._id}`, { withCredentials: true })
      setMessages(allMessages.filter(m => m._id !== messages._id))
    } catch (err) { console.log(err) }
    finally { setDeleting(false) }
  }

  const handleEdit = async () => {
    if (!editText.trim() || editText === messages.message) { setEditing(false); return }
    try {
      const res = await axios.put(`/api/message/edit/${messages._id}`, { message: editText }, { withCredentials: true })
      setMessages(allMessages.map(m => m._id === messages._id ? res.data : m))
      setEditing(false)
    } catch (err) { console.log(err) }
  }

  // Received bubble adapts to theme
  const receivedBg     = dark ? '#1e2d3d' : '#ffffff'
  const receivedColor  = dark ? '#e2e8f0' : '#1e293b'
  const receivedBorder = dark ? '#2a3d52' : '#e8edf5'
  const timeColor      = dark ? '#4b5563' : '#94a3b8'
  const menuBg         = dark ? '#1e2433' : '#ffffff'
  const menuBorder     = dark ? '#2a3347' : '#e2e8f0'

  return (
    <div
      className={`flex ${itsMe ? 'justify-end' : 'justify-start'} mb-1.5`}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className="max-w-[70%] relative">
        {editing ? (
          <div className="flex gap-1.5 items-center flex-wrap">
            <input
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setEditing(false) }}
              autoFocus
              className="px-3 py-1.5 rounded-xl text-[13px] focus:outline-none min-w-[120px]"
              style={{ background: dark ? '#1e2d3d' : '#fff', border: '2px solid #6366f1', color: dark ? '#e2e8f0' : '#1e293b' }}
            />
            <button onClick={handleEdit}
              className="px-2 py-1 text-white text-[11px] font-bold rounded-lg"
              style={{ background: '#6366f1' }}>Save</button>
            <button onClick={() => setEditing(false)}
              className="px-2 py-1 text-[11px] font-bold rounded-lg"
              style={{ background: dark ? '#2a3347' : '#e2e8f0', color: dark ? '#94a3b8' : '#475569' }}>✕</button>
          </div>
        ) : (
          <div>
            <div
              className={`relative px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed cursor-default transition-opacity ${deleting ? 'opacity-40' : ''}`}
              style={itsMe
                ? { background: '#4f46e5', color: '#fff', borderBottomRightRadius: '4px', boxShadow: '0 1px 6px rgba(79,70,229,0.3)' }
                : { background: receivedBg, color: receivedColor, borderBottomLeftRadius: '4px', border: `1px solid ${receivedBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }
              }
              onMouseEnter={() => itsMe && setShowMenu(true)}
            >
              {messages.message}
              {messages.edited && (
                <span className="text-[10px] ml-1.5 opacity-50">(edited)</span>
              )}

              {/* Action tooltip */}
              {itsMe && showMenu && (
                <div className="absolute -top-8 right-0 flex items-center gap-0.5 rounded-lg px-1 py-1 z-10 shadow-lg"
                  style={{ background: menuBg, border: `1px solid ${menuBorder}` }}>
                  <button
                    onClick={() => { setEditing(true); setShowMenu(false) }}
                    className="w-6 h-6 flex items-center justify-center rounded transition"
                    style={{ color: dark ? '#64748b' : '#94a3b8' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.background = dark ? '#1e2d3d' : '#eff2ff' }}
                    onMouseLeave={e => { e.currentTarget.style.color = dark ? '#64748b' : '#94a3b8'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => { handleDelete(); setShowMenu(false) }}
                    className="w-6 h-6 flex items-center justify-center rounded transition"
                    style={{ color: dark ? '#64748b' : '#94a3b8' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = dark ? '#2d1b1b' : '#fee2e2' }}
                    onMouseLeave={e => { e.currentTarget.style.color = dark ? '#64748b' : '#94a3b8'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <p className={`text-[10px] mt-0.5 px-0.5 ${itsMe ? 'text-right' : 'text-left'}`}
              style={{ color: timeColor }}>{time}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Message
