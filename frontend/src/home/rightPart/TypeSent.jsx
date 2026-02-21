import React, { useState } from 'react'
import useSendMessage from '../../context/useSendMessage'
import { useTheme } from '../../context/ThemeProvider'

const TypeSent = () => {
  const [text, setText] = useState('')
  const { loading, sendMessage } = useSendMessage()
  const { dark } = useTheme()

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    await sendMessage(text)
    setText('')
  }

  const canSend = text.trim().length > 0 && !loading

  // Mirror the header tint: slightly different from the messages area
  const barBg      = dark ? '#1e2433' : '#f8faff'
  const barBorder  = dark ? '#2a3347' : '#e8edf8'
  const inputBg    = dark ? '#111827' : '#ffffff'
  const inputBorder = dark ? '#2a3347' : '#e2e8f0'
  const inputColor  = dark ? '#e2e8f0' : '#1e293b'

  return (
    <div className="px-4 py-2.5 border-t"
      style={{ background: barBg, borderColor: barBorder }}>
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
          placeholder="Write a message…"
          className="flex-1 px-3.5 py-2 rounded-xl text-[13px] focus:outline-none transition"
          style={{ background: inputBg, color: inputColor, border: `1px solid ${inputBorder}` }}
          onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
          onBlur={e => e.currentTarget.style.borderColor = inputBorder}
        />
        <button
          type="submit"
          disabled={!canSend}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition flex-shrink-0"
          style={{
            background: canSend ? '#6366f1' : (dark ? '#1a2235' : '#e2e8f0'),
            color: canSend ? '#fff' : (dark ? '#374151' : '#94a3b8'),
          }}
        >
          {loading
            ? <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            : <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          }
        </button>
      </form>
    </div>
  )
}

export default TypeSent
