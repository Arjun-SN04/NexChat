import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { LuCheck, LuCopy, LuForward, LuTrash2, LuX } from 'react-icons/lu'
import useConversation from '../../Zustand/UserConversation'
import ConfirmDialog from '../ConfirmDialog'
import { useAuth } from '../../context/AuthProvider'
import { loadConversations } from '../../utils/conversations'
import { attachmentLabel } from '../../utils/attachments'

const BarButton = ({ onClick, disabled, title, danger, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
      danger
        ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
    }`}
  >
    {children}
  </button>
)

// Replaces the composer while selecting messages: copy, forward or delete them together.
const SelectionBar = () => {
  const { messages, setMessages, selectedIds, clearSelection, setForwardIds } = useConversation()
  const [AuthUser] = useAuth()
  const [confirm, setConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const selected = messages.filter((m) => selectedIds.includes(m._id))
  const allMine = selected.length > 0 && selected.every((m) => String(m.senderId) === String(AuthUser?._id))
  const count = selected.length

  // Esc leaves selection mode
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !confirm && clearSelection()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirm, clearSelection])

  const copy = async () => {
    const text = selected.map((m) => m.message || attachmentLabel(m.attachment)).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { /* clipboard not available */ }
  }

  const remove = async () => {
    setError('')
    try {
      const res = await axios.post('/api/message/delete-many', { ids: selectedIds }, { withCredentials: true })
      const gone = new Set(res.data.deleted)
      setMessages((prev) => prev.filter((m) => !gone.has(m._id)))
      loadConversations()
      setConfirm(false)
      clearSelection()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete. Try again.')
      setConfirm(false)
    }
  }

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950">
      {error && <p className="mb-2 px-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={clearSelection}
          aria-label="Cancel selection"
          title="Cancel (Esc)"
          className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <LuX className="size-5" />
        </button>
        <p className="mr-auto pl-1 text-sm font-semibold">
          {count ? `${count} selected` : 'Select messages'}
        </p>

        <BarButton onClick={copy} disabled={!count} title="Copy text">
          {copied ? <LuCheck className="size-4 text-emerald-600" /> : <LuCopy className="size-4" />}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </BarButton>
        <BarButton onClick={() => setForwardIds(selected.map((m) => m._id))} disabled={!count} title="Forward to others">
          <LuForward className="size-4" />
          <span className="hidden sm:inline">Forward</span>
        </BarButton>
        <BarButton
          onClick={() => setConfirm(true)}
          disabled={!allMine}
          danger
          title={count && !allMine ? 'You can only delete your own messages' : 'Delete'}
        >
          <LuTrash2 className="size-4" />
          <span className="hidden sm:inline">Delete</span>
        </BarButton>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        title={`Delete ${count} message${count === 1 ? '' : 's'}?`}
        description="They will be removed for both of you, along with any photos or files. This can't be undone."
      />
    </div>
  )
}

export default SelectionBar
