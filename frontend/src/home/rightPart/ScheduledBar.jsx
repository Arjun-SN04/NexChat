import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { LuChevronDown, LuClock, LuX } from 'react-icons/lu'
import useConversation from '../../Zustand/UserConversation'

const when = (date) => new Date(date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

// "2 scheduled messages" above the message box, with the list and Cancel buttons
const ScheduledBar = () => {
  const { selectedConversation, scheduledVersion } = useConversation()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const chatId = selectedConversation?._id

  useEffect(() => {
    if (!chatId) return
    let stale = false
    axios.get(`/api/ai/scheduled?chat=${chatId}`, { withCredentials: true })
      .then((res) => { if (!stale) setItems(res.data.scheduled) })
      .catch(() => {})
    return () => { stale = true }
  }, [chatId, scheduledVersion])

  if (!items.length) return null

  const cancel = async (id) => {
    try {
      await axios.delete(`/api/ai/scheduled/${id}`, { withCredentials: true })
      setItems((list) => list.filter((i) => i._id !== id))
    } catch { /* already sent */ }
  }

  return (
    <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/60">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">
        <LuClock className="size-3.5 text-indigo-500" />
        {items.length} scheduled message{items.length > 1 ? 's' : ''} · next {when(items[0].sendAt)}
        <LuChevronDown className={`ml-auto size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="space-y-1 pb-2">
          {items.map((i) => (
            <li key={i._id} className="flex items-start gap-3 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">{when(i.sendAt)}</p>
                <p className="line-clamp-2 text-slate-700 dark:text-slate-200">{i.text}</p>
              </div>
              <button onClick={() => cancel(i._id)} title="Cancel" aria-label="Cancel scheduled message" className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                <LuX className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ScheduledBar
