import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AnimatePresence, motion } from 'motion/react'
import { LuArrowLeft, LuBellRing, LuCheck, LuCircleAlert, LuClock, LuCopy, LuLanguages, LuLifeBuoy, LuListChecks, LuMessageCircle, LuNewspaper, LuPenLine, LuSend, LuSendHorizontal, LuSparkles, LuTrash2, LuX } from 'react-icons/lu'
import { selfContact } from '../../utils/conversations'
import useConversation from '../../Zustand/UserConversation'
import { useAuth } from '../../context/AuthProvider'
import { AiAvatar } from '../Avatar'
import ConfirmDialog from '../ConfirmDialog'

const api = { withCredentials: true }
const MAX_HEIGHT = 140

// What Nexa can do. Tapping an example puts it in the box to edit and send.
const CAPABILITIES = [
  { Icon: LuSend, title: 'Send messages', example: "Tell Arjun I'm running 10 minutes late" },
  { Icon: LuBellRing, title: 'Reminders', example: 'Remind me at 6pm to call mom' },
  { Icon: LuClock, title: 'Schedule messages', example: 'Wish Priya happy birthday tomorrow at 9am' },
  { Icon: LuListChecks, title: 'Manage scheduled', example: 'What do I have scheduled?' },
  { Icon: LuNewspaper, title: 'Catch up on a chat', example: 'Summarize my chat with Arjun' },
  { Icon: LuPenLine, title: 'Write and rewrite', example: 'Make this more professional: ' },
  { Icon: LuLanguages, title: 'Translate', example: "Translate 'see you soon' to Hindi" },
  { Icon: LuLifeBuoy, title: 'NexChat help', example: 'How do communities work?' },
]
const IN_CHATS = ['✨ Rewrite', 'Smart replies', 'Catch me up', 'Translate', 'Transcribe', 'Remind me', '@Nexa in groups']

const CapabilitiesCard = ({ onPick }) => (
  <div className="w-full max-w-xl">
    <div className="grid gap-2 sm:grid-cols-2">
      {CAPABILITIES.map(({ Icon, title, example }) => (
        <button
          key={title}
          onClick={() => onPick(example)}
          className="flex items-start gap-3 rounded-xl bg-white p-3 text-left shadow-xs ring-1 ring-slate-200 transition hover:bg-violet-50 hover:ring-violet-200 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-violet-500/10 dark:hover:ring-violet-500/30"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"><Icon className="size-4" /></span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">{title}</span>
            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">"{example.trim()}"</span>
          </span>
        </button>
      ))}
    </div>
    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-left ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-800">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"><LuSparkles className="size-3.5 text-violet-500" /> Also in every chat</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {IN_CHATS.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
            {t}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Find Translate, Transcribe and Remind me in a message's ⋯ menu.</p>
    </div>
  </div>
)

const timeZone = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'UTC' } })()
const formatWhen = (date) => new Date(date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// Nexa's Markdown, sized to sit inside a normal chat bubble
const md = {
  p: (props) => <p className="my-1.5 first:mt-0 last:mb-0" {...props} />,
  ul: (props) => <ul className="my-1.5 list-disc space-y-0.5 pl-4 first:mt-0 last:mb-0" {...props} />,
  ol: (props) => <ol className="my-1.5 list-decimal space-y-0.5 pl-4 first:mt-0 last:mb-0" {...props} />,
  h1: (props) => <p className="my-1.5 font-semibold first:mt-0" {...props} />,
  h2: (props) => <p className="my-1.5 font-semibold first:mt-0" {...props} />,
  h3: (props) => <p className="my-1.5 font-semibold first:mt-0" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  a: (props) => <a className="font-medium text-indigo-600 underline underline-offset-2 dark:text-indigo-400" target="_blank" rel="noreferrer" {...props} />,
  blockquote: (props) => <blockquote className="my-1.5 border-l-2 border-slate-300 pl-2.5 text-slate-600 dark:border-slate-600 dark:text-slate-300" {...props} />,
  hr: () => <hr className="my-2 border-slate-200 dark:border-slate-700" />,
  pre: (props) => <pre className="my-1.5 overflow-x-auto rounded-lg bg-slate-900 p-2.5 text-xs leading-relaxed text-slate-100 dark:bg-black/40" {...props} />,
  code: ({ className, children, ...props }) =>
    className
      ? <code className={className} {...props}>{children}</code>
      : <code className="rounded bg-slate-100 px-1 py-0.5 text-[12.5px] dark:bg-slate-700/70" {...props}>{children}</code>,
  table: (props) => <div className="my-1.5 overflow-x-auto"><table className="w-full border-collapse text-left text-xs" {...props} /></div>,
  th: (props) => <th className="border-b border-slate-200 px-2 py-1 font-semibold dark:border-slate-700" {...props} />,
  td: (props) => <td className="border-b border-slate-100 px-2 py-1 align-top dark:border-slate-800" {...props} />,
}

// Same sizes as normal chat bubbles
const bubbleWidth = 'max-w-[80%] sm:max-w-[70%] lg:max-w-[min(60%,640px)]'

const Thinking = () => (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-3 flex items-end gap-2">
    <AiAvatar size="xs" />
    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13px] shadow-xs ring-1 ring-violet-200 dark:bg-slate-800 dark:ring-violet-500/30">
      <span className="font-medium text-violet-600 dark:text-violet-300">Nexa is thinking</span>
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </span>
    </div>
  </motion.div>
)

// What Nexa did: a card per action, with Cancel / Open chat
const ActionCard = ({ action, status, onCancel, onOpen }) => {
  const [busy, setBusy] = useState(false)
  const state = action.type === 'scheduled' ? status || 'pending' : action.type
  const look = {
    pending: { Icon: LuClock, title: `Scheduled · ${formatWhen(action.sendAt)}`, tone: 'text-indigo-600 dark:text-indigo-400' },
    sending: { Icon: LuClock, title: 'Sending…', tone: 'text-indigo-600 dark:text-indigo-400' },
    sent: { Icon: LuCheck, title: action.type === 'sent' ? 'Sent' : `Sent · ${formatWhen(action.sendAt)}`, tone: 'text-emerald-600 dark:text-emerald-400' },
    cancelled: { Icon: LuX, title: 'Cancelled', tone: 'text-slate-500 dark:text-slate-400' },
    failed: { Icon: LuCircleAlert, title: action.error ? `Couldn't send: ${action.error}` : "Couldn't send", tone: 'text-red-600 dark:text-red-400' },
  }[state] || { Icon: LuCheck, title: state, tone: 'text-slate-500' }

  return (
    <div className="mt-1.5 w-full max-w-sm rounded-xl bg-white px-3 py-2.5 text-sm shadow-xs ring-1 ring-slate-200/80 dark:bg-slate-800/70 dark:ring-slate-700/60">
      <p className={`flex items-center gap-1.5 text-xs font-medium ${look.tone}`}><look.Icon className="size-3.5" /> {look.title}</p>
      {action.to && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">To {action.to}</p>}
      {action.text && <p className="mt-1 line-clamp-3 border-l-2 border-slate-200 pl-2 text-slate-700 dark:border-slate-600 dark:text-slate-200">{action.text}</p>}
      <div className="mt-2 flex gap-1.5">
        {state === 'pending' && (
          <button disabled={busy} onClick={async () => { setBusy(true); await onCancel(action.id); setBusy(false) }} className="h-7 rounded-md px-2.5 text-xs font-medium text-red-600 ring-1 ring-slate-200 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:ring-slate-700 dark:hover:bg-red-500/10">
            Cancel
          </button>
        )}
        {action.chatId && state !== 'cancelled' && (
          <button onClick={() => onOpen(action)} className="inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800">
            <LuMessageCircle className="size-3.5" /> Open chat
          </button>
        )}
      </div>
    </div>
  )
}

const NexaBubble = ({ message, statuses, onCancel, onOpen, onPick }) => {
  if (message.actions?.some((a) => a.type === 'capabilities')) {
    return (
      <div className="mb-3 flex items-end gap-2 pb-1">
        <AiAvatar size="xs" />
        <div className="min-w-0 flex-1">
          <p className="mb-2 inline-block rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700/60">Here's what I can do. Tap one to try it.</p>
          <CapabilitiesCard onPick={onPick} />
        </div>
      </div>
    )
  }
  return <NexaAnswer message={message} statuses={statuses} onCancel={onCancel} onOpen={onOpen} />
}

const NexaAnswer = ({ message, statuses, onCancel, onOpen }) => {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }
  return (
    <div className="group mb-3 flex items-end gap-2 pb-1">
      <AiAvatar size="xs" />
      <div className={`flex flex-col items-start ${bubbleWidth}`}>
        <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-sm leading-relaxed text-slate-800 shadow-xs ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700/60">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{message.content}</ReactMarkdown>
        </div>
        {(message.actions || []).map((a, i) => (
          <ActionCard key={i} action={a} status={a.id ? statuses[a.id] : null} onCancel={onCancel} onOpen={onOpen} />
        ))}
        <p className="mt-1 flex items-center gap-2 px-1 text-[11px] text-slate-400">
          {message.createdAt && formatTime(message.createdAt)}
          <button onClick={copy} className="inline-flex items-center gap-1 opacity-0 transition hover:text-slate-700 group-hover:opacity-100 focus:opacity-100 dark:hover:text-slate-200">
            {copied ? <LuCheck className="size-3" /> : <LuCopy className="size-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </p>
      </div>
    </div>
  )
}

const MyBubble = ({ message }) => (
  <div className="mb-3 flex justify-end pb-1">
    <div className={`flex flex-col items-end ${bubbleWidth}`}>
      <p className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-indigo-600 px-3.5 py-2 text-sm leading-relaxed text-white">{message.content}</p>
      <p className="mt-1 px-1 text-[11px] text-slate-400">{message.createdAt && formatTime(message.createdAt)}</p>
    </div>
  </div>
)

// Private chat with Nexa, NexChat's AI assistant (answers come from Groq via the server)
const AiChat = () => {
  const [AuthUser] = useAuth()
  const { setSelectedConversation, contacts, groups, scheduledVersion } = useConversation()
  const [statuses, setStatuses] = useState({}) // scheduled message id -> pending | sent | cancelled | failed
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [thinking, setThinking] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const firstName = AuthUser?.fullName?.split(' ')[0]

  useEffect(() => {
    axios.get('/api/ai/messages', api)
      .then((res) => setMessages(res.data.messages))
      .catch(() => setError('Could not load your chat with Nexa.'))
      .finally(() => setLoading(false))
    inputRef.current?.focus()
  }, [])

  // Keep scheduled cards up to date (sent, cancelled…)
  useEffect(() => {
    axios.get('/api/ai/scheduled?all=1', api)
      .then((res) => setStatuses(Object.fromEntries(res.data.scheduled.map((j) => [j._id, j.status]))))
      .catch(() => {})
  }, [scheduledVersion, messages.length])

  const cancelScheduled = async (id) => {
    try {
      await axios.delete(`/api/ai/scheduled/${id}`, api)
      setStatuses((s) => ({ ...s, [id]: 'cancelled' }))
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel it.')
    }
  }

  const openChat = (action) => {
    const chat = String(action.chatId) === String(AuthUser?._id)
      ? selfContact(AuthUser)
      : action.isGroup
        ? groups.find((g) => String(g._id) === String(action.chatId))
        : contacts.find((c) => String(c._id) === String(action.chatId))
    if (chat) setSelectedConversation(chat)
  }

  // Follow the conversation
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: messages.length > 2 ? 'smooth' : 'auto' })
  }, [messages, thinking])

  // Grow the box with the text
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }, [text])

  const ask = async (question = text) => {
    const value = question.trim()
    if (!value || thinking) return
    setError('')
    setText('')
    const temp = { _id: `temp-${Date.now()}`, role: 'user', content: value, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, temp])
    setThinking(true)
    try {
      const res = await axios.post('/api/ai/messages', { message: value, timeZone }, api)
      setMessages((prev) => [...prev.filter((m) => m._id !== temp._id), res.data.question, res.data.answer])
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== temp._id))
      setText(value)
      setError(err.response?.data?.error || "Nexa couldn't answer. Try again.")
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }

  // Examples go into the box (not sent), so people can adjust names and times first
  const fill = (example) => {
    setText(example)
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(example.length, example.length)
    })
  }

  const clear = async () => {
    await axios.delete('/api/ai/messages', api)
    setMessages([])
    setConfirmClear(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() }
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-5 dark:border-slate-800 dark:bg-slate-950">
        <button onClick={() => setSelectedConversation(null)} className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800" aria-label="Back to chats">
          <LuArrowLeft className="size-5" />
        </button>
        <AiAvatar size="sm" />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">Nexa</p>
          <p className={`text-xs ${thinking ? 'font-medium text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {thinking ? 'thinking…' : 'AI assistant'}
          </p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setConfirmClear(true)} className="ml-auto flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400" title="Clear chat" aria-label="Clear chat">
            <LuTrash2 className="size-4.5" />
          </button>
        )}
      </header>

      <div ref={scrollRef} className="chat-bg min-h-0 flex-1 overflow-y-auto">
        <div className="h-full px-4 sm:px-6 lg:px-8">
          {loading ? null : messages.length === 0 && !thinking ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <AiAvatar size="lg" />
              <h2 className="mt-4 text-lg font-semibold">Hi {firstName}, I'm Nexa</h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">Your assistant in NexChat. Pick something to try, or just ask.</p>
              <div className="mt-6 flex w-full justify-center">
                <CapabilitiesCard onPick={fill} />
              </div>
            </div>
          ) : (
            <div className="pb-2 pt-4">
              {messages.map((m) => (m.role === 'assistant'
                ? <NexaBubble key={m._id} message={m} statuses={statuses} onCancel={cancelScheduled} onOpen={openChat} onPick={fill} />
                : <MyBubble key={m._id} message={m} />))}
              <AnimatePresence>{thinking && <Thinking />}</AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950">
        {error && <p className="mb-2 px-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
        <form onSubmit={(e) => { e.preventDefault(); ask() }} className="flex items-end gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-indigo-500/50">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={4000}
            placeholder="Message Nexa"
            className="min-h-10 flex-1 resize-none bg-transparent py-2.5 pl-2.5 text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
            style={{ maxHeight: MAX_HEIGHT }}
          />
          <button type="submit" disabled={!text.trim() || thinking} aria-label="Send" title="Send" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500">
            <LuSendHorizontal className="size-4" />
          </button>
        </form>
        <p className="mt-1.5 text-center text-[11px] text-slate-400">Nexa is AI and can make mistakes.</p>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clear}
        title="Clear chat with Nexa?"
        description="All your messages with Nexa will be deleted."
        confirmLabel="Clear"
        busyLabel="Clearing…"
      />
    </div>
  )
}

export default AiChat
