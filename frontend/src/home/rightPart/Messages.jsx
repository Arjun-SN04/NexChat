import React, { useEffect, useRef } from 'react'
import Message from './Message'
import useGetMessages from '../../context/useGetMessages.js'
import useListenMessages from '../../context/useListenMessages.js'
import { useTheme } from '../../context/ThemeProvider'

const Messages = () => {
  const { loading, messages } = useGetMessages()
  useListenMessages()
  const { dark } = useTheme()
  const bottomRef = useRef(null)

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length > 0 ? (
        messages.map(message => <Message key={message._id} messages={message} />)
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
