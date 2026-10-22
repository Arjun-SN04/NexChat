import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { LuArrowUpRight, LuCheck, LuLoaderCircle, LuSparkles } from 'react-icons/lu'
import useConversation from '../../Zustand/UserConversation'
import { useAuth } from '../../context/AuthProvider'
import { selfContact } from '../../utils/conversations'

const api = { withCredentials: true }
const errorOf = (err, fallback) => err.response?.data?.error || fallback

const isVoice = (a) => a && (a.kind === 'audio' || a.mimeType?.startsWith('audio/'))

// Voice note → text. Saved on the message, so everyone in the chat sees it.
export const Transcript = ({ message, itsMe }) => {
  const { setMessages } = useConversation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!isVoice(message.attachment)) return null
  const muted = itsMe ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'

  if (message.transcript) {
    return <p className={`mt-1.5 max-w-xs text-[13px] italic leading-snug ${muted}`}>“{message.transcript}”</p>
  }
  const run = async (e) => {
    e.stopPropagation()
    setBusy(true)
    setError('')
    try {
      const res = await axios.post(`/api/ai/transcribe/${message._id}`, {}, api)
      setMessages((prev) => prev.map((m) => (m._id === message._id ? { ...m, transcript: res.data.transcript } : m)))
    } catch (err) {
      setError(errorOf(err, "Couldn't transcribe"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <button onClick={run} disabled={busy} className={`mt-1 inline-flex items-center gap-1 text-[12px] font-medium ${itsMe ? 'text-indigo-100 hover:text-white' : 'text-indigo-600 hover:underline dark:text-indigo-400'}`}>
      {busy ? <LuLoaderCircle className="size-3 animate-spin" /> : <LuSparkles className="size-3" />}
      {busy ? 'Transcribing…' : error || 'Transcribe'}
    </button>
  )
}

// Translation shown under the original text
export const Translation = ({ translation, itsMe, onHide }) => {
  if (!translation) return null
  const tone = itsMe ? 'border-white/40 text-indigo-50' : 'border-indigo-300 text-slate-700 dark:border-indigo-500/50 dark:text-slate-200'
  return (
    <div className={`mt-1.5 border-l-2 pl-2 text-[13px] leading-snug ${tone}`}>
      {translation.loading ? (
        <span className="inline-flex items-center gap-1 opacity-80"><LuLoaderCircle className="size-3 animate-spin" /> Translating…</span>
      ) : translation.error ? (
        <span className="opacity-80">{translation.error}</span>
      ) : (
        <>
          <span className="whitespace-pre-wrap">{translation.text}</span>
          <button onClick={(e) => { e.stopPropagation(); onHide() }} className={`ml-1.5 text-[11px] underline-offset-2 hover:underline ${itsMe ? 'text-indigo-200' : 'text-slate-400'}`}>
            {translation.language} · hide
          </button>
        </>
      )}
    </div>
  )
}

export const useTranslation = (message) => {
  const [translation, setTranslation] = useState(null)
  const translate = async () => {
    if (translation?.text) return setTranslation(null)
    setTranslation({ loading: true })
    try {
      const res = await axios.post(`/api/ai/translate/${message._id}`, { language: navigator.language || 'en' }, api)
      const plain = (t) => String(t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
      const same = plain(res.data.text) === plain([message.message, message.transcript].filter(Boolean).join(' '))
      setTranslation(same ? { error: `Already in ${res.data.language}` } : { text: res.data.text, language: res.data.language })
    } catch (err) {
      setTranslation({ error: errorOf(err, "Couldn't translate") })
    }
  }
  return { translation, translate, hide: () => setTranslation(null) }
}

// Reminders made with "Remind me about this" link back to the message
export const GoToMessage = ({ message, itsMe }) => {
  const [AuthUser] = useAuth()
  const { contacts, groups, setSelectedConversation, setPendingJump } = useConversation()
  const ref = message.ref
  if (!ref?.messageId) return null
  const open = (e) => {
    e.stopPropagation()
    const chat = String(ref.chatId) === String(AuthUser?._id)
      ? selfContact(AuthUser)
      : ref.isGroup
        ? groups.find((g) => String(g._id) === String(ref.chatId))
        : contacts.find((c) => String(c._id) === String(ref.chatId))
    if (!chat) return
    setPendingJump(ref.messageId)
    setSelectedConversation(chat)
  }
  return (
    <button onClick={open} className={`mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium ${itsMe ? 'text-indigo-100 hover:text-white' : 'text-indigo-600 hover:underline dark:text-indigo-400'}`}>
      <LuArrowUpRight className="size-3.5" /> Go to message
    </button>
  )
}

const at = (hours) => new Date(Date.now() + hours * 3600_000)
const tomorrowAt = (h) => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(h, 0, 0, 0); return d }
const toLocalInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

// Small menu next to a message: when should Nexa remind you?
export const RemindMenu = ({ message, align, placement, onClose }) => {
  const ref = useRef(null)
  const [custom, setCustom] = useState(() => toLocalInput(at(2)))
  const [state, setState] = useState(null) // null | 'saving' | 'done' | error text

  useEffect(() => {
    const onDown = (e) => !ref.current?.contains(e.target) && onClose()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const remind = async (when) => {
    setState('saving')
    try {
      await axios.post(`/api/ai/remind/${message._id}`, { sendAt: when.toISOString() }, api)
      setState('done')
      setTimeout(onClose, 1200)
    } catch (err) {
      setState(errorOf(err, "Couldn't set the reminder"))
    }
  }

  const options = [['In 1 hour', at(1)], ['In 3 hours', at(3)], ['Tomorrow, 9 AM', tomorrowAt(9)]]
  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className={`absolute z-30 w-56 rounded-xl bg-white p-1 text-left text-sm shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 ${placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} ${align === 'right' ? 'right-0' : 'left-0'}`}
    >
      {state === 'done' ? (
        <p className="flex items-center gap-2 px-3 py-3 text-emerald-600 dark:text-emerald-400"><LuCheck className="size-4" /> Reminder set</p>
      ) : (
        <>
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Remind me</p>
          {options.map(([label, when]) => (
            <button key={label} disabled={state === 'saving'} onClick={() => remind(when)} className="block w-full rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800">
              {label}
            </button>
          ))}
          <div className="flex items-center gap-1.5 border-t border-slate-100 p-2 dark:border-slate-800">
            <input type="datetime-local" value={custom} onChange={(e) => setCustom(e.target.value)} className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-950" />
            <button disabled={state === 'saving' || !custom} onClick={() => remind(new Date(custom))} className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">Set</button>
          </div>
          {state && state !== 'saving' && <p className="px-3 pb-2 text-xs text-red-600 dark:text-red-400">{state}</p>}
        </>
      )}
    </div>
  )
}
