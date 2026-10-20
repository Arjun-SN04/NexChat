import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { AnimatePresence, motion } from 'motion/react'
import { LuCamera, LuCheck, LuFileText, LuLoaderCircle, LuMic, LuPaperclip, LuPencil, LuReply, LuSendHorizontal, LuTrash2, LuX } from 'react-icons/lu'
import useSendMessage from '../../context/useSendMessage'
import useConversation from '../../Zustand/UserConversation'
import { useAuth } from '../../context/AuthProvider'
import { useSocket } from '../../context/SocketProvider'
import { canEdit, jumpToMessage } from '../../utils/messages'
import { loadConversations } from '../../utils/conversations'
import { ACCEPT, MAX_FILE_BYTES, attachmentLabel, formatBytes, prepareFile } from '../../utils/attachments'
import useVoiceRecorder, { MAX_VOICE_SECONDS } from '../../hooks/useVoiceRecorder'
import CameraDialog from './CameraDialog'

const MAX_HEIGHT = 160
const TYPING_IDLE_MS = 2500

// Message composer. Also handles editing a message and replying to one:
// both show a banner above the input. Enter sends, Shift+Enter adds a line,
// Esc cancels, ↑ on an empty box edits your last message.
const TypeSent = () => {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { loading, sendMessage } = useSendMessage()
  const {
    selectedConversation, messages, setMessages,
    replyingTo, setReplyingTo, editingMessage, setEditingMessage, setHighlightedId,
    pendingFile, setPendingFile,
  } = useConversation()
  const [preparing, setPreparing] = useState(false)
  const [progress, setProgress] = useState(null) // 0..1 while uploading
  const fileInputRef = useRef(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const voice = useVoiceRecorder()
  const [AuthUser] = useAuth()
  const inputRef = useRef(null)
  const myId = String(AuthUser?._id)
  const { socket } = useSocket()

  // Typing indicator: tell the other person while I'm typing
  const typingTo = useRef(null)
  const typingTimer = useRef(null)
  const stopTypingSignal = () => {
    clearTimeout(typingTimer.current)
    if (typingTo.current) socket?.emit('stopTyping', { to: typingTo.current })
    typingTo.current = null
  }
  const typingSignal = () => {
    const to = selectedConversation?._id
    if (!to || !socket) return
    if (typingTo.current !== to) {
      stopTypingSignal()
      socket.emit('typing', { to })
      typingTo.current = to
    }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(stopTypingSignal, TYPING_IDLE_MS)
  }
  // Stop when switching chats or leaving the page
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => stopTypingSignal, [selectedConversation?._id])

  const handleChange = (e) => {
    const value = e.target.value
    setText(value)
    if (editingMessage) return
    if (value.trim()) typingSignal()
    else stopTypingSignal()
  }

  // ── Attachments ──────────────────────────────────────────
  const pickFile = async (file) => {
    if (!file || editingMessage) return
    setError('')
    setPreparing(true)
    try {
      setPendingFile(await prepareFile(file))
      inputRef.current?.focus()
    } catch (err) {
      setError(err.message)
    } finally {
      setPreparing(false)
    }
  }

  // Free the local preview when the file is removed or replaced
  useEffect(() => () => { if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl) }, [pendingFile])

  // Files dropped onto the chat area arrive through this event
  useEffect(() => {
    const onAttach = (e) => pickFile(e.detail)
    window.addEventListener('nexchat:attach', onAttach)
    return () => window.removeEventListener('nexchat:attach', onAttach)
  })

  const onPaste = (e) => {
    const file = e.clipboardData?.files?.[0]
    if (file && !editingMessage) { e.preventDefault(); pickFile(file) }
  }

  const focusEnd = () => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }

  const resize = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }
  useEffect(resize, [text])

  // Focus the box when opening a chat; drop any draft from the previous one
  useEffect(() => { setText(''); setError(''); inputRef.current?.focus() }, [selectedConversation?._id])

  // Start editing: load the message text into the box
  useEffect(() => {
    setError('')
    if (editingMessage) {
      setText(editingMessage.message)
      requestAnimationFrame(focusEnd)
    }
  }, [editingMessage])

  // Start replying: focus the box
  useEffect(() => {
    setError('')
    if (replyingTo) inputRef.current?.focus()
  }, [replyingTo])

  const cancel = () => {
    if (editingMessage) { setEditingMessage(null); setText('') }
    else if (replyingTo) setReplyingTo(null)
    setError('')
  }

  const saveEdit = async () => {
    const value = text.trim()
    if (!value && !editingMessage.attachment) return
    if (value === editingMessage.message) { cancel(); return }
    setSaving(true)
    try {
      const res = await axios.put(`/api/message/edit/${editingMessage._id}`, { message: value }, { withCredentials: true })
      setMessages((prev) => prev.map((m) => (m._id === res.data._id ? res.data : m)))
      setEditingMessage(null)
      setText('')
      loadConversations()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your edit. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (loading || saving || preparing) return
    if (editingMessage) return saveEdit()
    if (!text.trim() && !pendingFile) return
    const value = text
    const replyId = replyingTo?._id || null
    const file = pendingFile?.file || null
    stopTypingSignal()
    setText('')
    setReplyingTo(null)
    if (file) setProgress(0)
    const sendError = await sendMessage(value, replyId, file, setProgress)
    setProgress(null)
    if (sendError) { setError(sendError); setText(value) }
    else if (file) setPendingFile(null)
    inputRef.current?.focus()
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
    else if (e.key === 'Escape' && (editingMessage || replyingTo)) { e.preventDefault(); cancel() }
    else if (e.key === 'ArrowUp' && !text && !editingMessage) {
      const lastMine = [...messages].reverse().find((m) => String(m.senderId) === myId)
      if (lastMine && canEdit(lastMine)) { e.preventDefault(); setEditingMessage(lastMine) }
    }
  }

  // ── Voice notes ──────────────────────────────────────────
  const startVoice = async () => {
    setError('')
    stopTypingSignal()
    await voice.start()
  }

  const sendVoice = async () => {
    const blob = await voice.finish()
    if (!blob || blob.size < 1000) return // too short to be useful
    if (blob.size > MAX_FILE_BYTES) { setError('Voice message is too long'); return }
    const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm'
    const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type })
    const replyId = replyingTo?._id || null
    setReplyingTo(null)
    setProgress(0)
    const sendError = await sendMessage('', replyId, file, setProgress)
    setProgress(null)
    if (sendError) setError(sendError)
  }

  // Auto-send when the time limit is reached
  useEffect(() => {
    if (voice.recording && voice.seconds >= MAX_VOICE_SECONDS) sendVoice()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.seconds])

  // Stop recording if you switch chats
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => voice.cancel(), [selectedConversation?._id])

  const busy = loading || saving
  const canSubmit = (text.trim().length > 0 || (!!pendingFile && !editingMessage) || (!!editingMessage?.attachment)) && !busy && !preparing
  const firstName = selectedConversation?.fullName?.split(' ')[0]
  const target = editingMessage || replyingTo
  const replyName = replyingTo && (String(replyingTo.senderId) === myId ? 'yourself' : firstName)

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950">
      {(error || voice.error) && (
        <p className="mb-2 px-1 text-xs font-medium text-red-600 dark:text-red-400">{error || voice.error}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-indigo-500/50"
      >
        {/* Reply / edit context, attached to the top of the box */}
        <AnimatePresence initial={false}>
          {target && (
            <motion.div
              key={editingMessage ? `edit-${target._id}` : `reply-${target._id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  {editingMessage ? <LuPencil className="size-4" /> : <LuReply className="size-4" />}
                </span>
                <button
                  type="button"
                  onClick={() => jumpToMessage(target._id, setHighlightedId)}
                  className="min-w-0 flex-1 text-left"
                  title="Show message"
                >
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {editingMessage ? 'Edit message' : `Reply to ${replyName}`}
                  </p>
                  <p className="truncate text-[13px] text-slate-500 dark:text-slate-400">{target.message || attachmentLabel(target.attachment)}</p>
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  aria-label={editingMessage ? 'Cancel edit' : 'Cancel reply'}
                  title="Cancel (Esc)"
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  <LuX className="size-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chosen file */}
        {(pendingFile || preparing) && !editingMessage && (
          <div className="relative flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
            {preparing ? (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <LuLoaderCircle className="size-5 animate-spin text-slate-400" />
              </span>
            ) : pendingFile.kind === 'image' ? (
              <img src={pendingFile.previewUrl} alt="" className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
            ) : pendingFile.kind === 'video' ? (
              <video src={pendingFile.previewUrl} muted className="size-12 shrink-0 rounded-lg bg-black object-cover" />
            ) : (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <LuFileText className="size-5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{preparing ? 'Preparing file…' : pendingFile.file.name}</p>
              {!preparing && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {progress !== null
                    ? `Uploading ${Math.round(progress * 100)}%`
                    : pendingFile.originalSize > pendingFile.file.size
                      ? `${formatBytes(pendingFile.file.size)} · compressed from ${formatBytes(pendingFile.originalSize)}`
                      : formatBytes(pendingFile.file.size)}
                </p>
              )}
            </div>
            {!preparing && progress === null && (
              <button
                type="button"
                onClick={() => setPendingFile(null)}
                aria-label="Remove file"
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <LuX className="size-4" />
              </button>
            )}
            {progress !== null && (
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-100 dark:bg-slate-800">
                <div className="h-full bg-indigo-500 transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            )}
          </div>
        )}

        {voice.recording ? (
          /* Recording a voice note */
          <div className="flex items-center gap-2 p-1.5">
            <button
              type="button"
              onClick={voice.cancel}
              aria-label="Discard voice message"
              title="Discard"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              <LuTrash2 className="size-4.5" />
            </button>
            <div className="flex flex-1 items-center gap-3 px-1">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
              </span>
              <span className="text-sm font-medium tabular-nums">
                {Math.floor(voice.seconds / 60)}:{String(voice.seconds % 60).padStart(2, '0')}
              </span>
              <span className="text-xs text-slate-400">Recording · max {MAX_VOICE_SECONDS / 60} min</span>
            </div>
            <button
              type="button"
              onClick={sendVoice}
              aria-label="Send voice message"
              title="Send"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 active:scale-95"
            >
              <LuSendHorizontal className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-1 p-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; pickFile(f) }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!editingMessage || busy || preparing}
              aria-label="Attach a file"
              title="Attach a photo or file (max 10 MB)"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <LuPaperclip className="size-4.5" />
            </button>
            {navigator.mediaDevices?.getUserMedia && (
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                disabled={!!editingMessage || busy || preparing}
                aria-label="Take a photo"
                title="Take a photo"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <LuCamera className="size-4.5" />
              </button>
            )}
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              onChange={handleChange}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              placeholder={editingMessage ? 'Edit your message' : firstName ? `Message ${firstName}` : 'Write a message'}
              className="min-h-10 flex-1 resize-none bg-transparent py-2.5 pl-1 text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              style={{ maxHeight: MAX_HEIGHT }}
            />
            {/* Mic when there's nothing to send, otherwise Send */}
            {!text.trim() && !pendingFile && !editingMessage && !busy ? (
              <button
                type="button"
                onClick={startVoice}
                aria-label="Record a voice message"
                title="Record a voice message"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <LuMic className="size-4.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSubmit}
                aria-label={editingMessage ? 'Save edit' : 'Send message'}
                title={editingMessage ? 'Save edit' : 'Send'}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
              >
                {busy ? <LuLoaderCircle className="size-4 animate-spin" />
                  : editingMessage ? <LuCheck className="size-4" />
                  : <LuSendHorizontal className="size-4" />}
              </button>
            )}
          </div>
        )}
      </form>

      <AnimatePresence>
        {cameraOpen && <CameraDialog onClose={() => setCameraOpen(false)} onCapture={pickFile} />}
      </AnimatePresence>

    </div>
  )
}

export default TypeSent
