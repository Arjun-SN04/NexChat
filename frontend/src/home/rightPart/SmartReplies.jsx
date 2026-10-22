import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { LuSparkles } from 'react-icons/lu'
import useConversation from '../../Zustand/UserConversation'
import useSendMessage from '../../context/useSendMessage'
import { useAuth } from '../../context/AuthProvider'
import { canPost } from '../../utils/groups'

// 2–3 one-tap replies to the last message someone sent you
const SmartReplies = () => {
  const { selectedConversation, messages } = useConversation()
  const { sendMessage, loading } = useSendMessage()
  const [AuthUser] = useAuth()
  const myId = String(AuthUser?._id)
  const [state, setState] = useState({ for: null, replies: [] })
  const [used, setUsed] = useState(null)

  const last = messages[messages.length - 1]
  const eligible = last && !selectedConversation?.isSelf && canPost(selectedConversation, myId) &&
    String(last.senderId) !== myId && !last.call && (last.message?.trim() || last.transcript) &&
    Date.now() - new Date(last.createdAt).getTime() < 3 * 24 * 3600_000
  const lastId = eligible ? String(last._id) : null

  useEffect(() => {
    if (!lastId) return
    let stale = false
    // Wait a moment, so quick bursts of messages only ask once
    const t = setTimeout(() => {
      axios.post('/api/ai/smart-replies', { chatId: selectedConversation._id }, { withCredentials: true })
        .then((res) => { if (!stale && res.data.for === lastId) setState({ for: lastId, replies: res.data.replies }) })
        .catch(() => {})
    }, 600)
    return () => { stale = true; clearTimeout(t) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId])

  if (!lastId || state.for !== lastId || used === lastId || !state.replies.length) return null

  const send = async (text) => {
    setUsed(lastId)
    await sendMessage(text)
  }

  return (
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-4 pb-1 pt-2 sm:px-6 lg:px-8">
      <LuSparkles className="size-3.5 shrink-0 text-violet-500" aria-label="Suggested by Nexa" />
      {state.replies.map((r) => (
        <button
          key={r}
          disabled={loading}
          onClick={() => send(r)}
          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[13px] text-slate-700 shadow-xs ring-1 ring-slate-200 transition hover:bg-violet-50 hover:text-violet-700 hover:ring-violet-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          {r}
        </button>
      ))}
    </div>
  )
}

export default SmartReplies
