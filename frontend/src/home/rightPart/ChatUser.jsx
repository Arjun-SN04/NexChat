import React from 'react'
import { LuArrowLeft, LuInfo, LuTrash2 } from 'react-icons/lu'
import useConversation from '../../Zustand/UserConversation'
import { useSocket } from '../../context/SocketProvider'
import Avatar from '../Avatar'

const iconBtn =
  'flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'

// Header of the open conversation.
const ChatUser = ({ onBack, onToggleInfo, infoOpen, onClear }) => {
  const { selectedConversation, typingUsers } = useConversation()
  const { onlineUsers } = useSocket()
  if (!selectedConversation) return null

  const isOnline = onlineUsers.map(String).includes(String(selectedConversation._id))

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-5 dark:border-slate-800 dark:bg-slate-950">
      <button onClick={onBack} className={`${iconBtn} md:hidden`} aria-label="Back to chats">
        <LuArrowLeft className="size-5" />
      </button>

      <button onClick={onToggleInfo} className="flex min-w-0 items-center gap-3 rounded-lg py-1 pr-2 text-left">
        <Avatar name={selectedConversation.fullName} src={selectedConversation.avatar?.url} size="sm" online={isOnline} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{selectedConversation.fullName}</p>
          {typingUsers[String(selectedConversation._id)] ? (
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">typing…</p>
          ) : (
            <p className={`text-xs ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
          )}
        </div>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <button onClick={onClear} className={`${iconBtn} hover:bg-red-50! hover:text-red-600! dark:hover:bg-red-500/10! dark:hover:text-red-400!`} title="Clear chat" aria-label="Clear chat">
          <LuTrash2 className="size-4.5" />
        </button>
        <button
          onClick={onToggleInfo}
          className={`${iconBtn} ${infoOpen ? 'bg-slate-100! text-slate-900! dark:bg-slate-800! dark:text-white!' : ''}`}
          title="Contact info"
          aria-label="Contact info"
          aria-pressed={infoOpen}
        >
          <LuInfo className="size-4.5" />
        </button>
      </div>
    </header>
  )
}

export default ChatUser
