import React from 'react'
import ChatUser from './ChatUser'
import Messages from './Messages'
import TypeSent from './TypeSent'
import useConversation from '../../Zustand/UserConversation'
import { useTheme } from '../../context/ThemeProvider'

const Right = () => {
  const { selectedConversation, setSelectedConversation } = useConversation()
  const { dark } = useTheme()

  const emptyBg   = dark ? '#0f172a' : '#f5f7ff'
  const emptyIcon = dark ? '#1e2d47' : '#e0e7ff'
  const emptyH    = dark ? '#e2e8f0' : '#334155'
  const emptyP    = dark ? '#475569' : '#94a3b8'

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full select-none"
        style={{ background: emptyBg }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: emptyIcon }}>
          <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <h2 className="text-[14px] font-bold mb-1" style={{ color: emptyH }}>Select a conversation</h2>
        <p className="text-[12px]" style={{ color: emptyP }}>Pick a contact on the left</p>
      </div>
    )
  }

  const msgBg = dark ? '#0f172a' : '#f5f7ff'

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ChatUser onBack={() => setSelectedConversation(null)} />
      <div className="flex-1 overflow-hidden flex flex-col" style={{ background: msgBg }}>
        <Messages />
      </div>
      <TypeSent />
    </div>
  )
}

export default Right
