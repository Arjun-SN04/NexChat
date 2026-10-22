import React from 'react'
import { LuArrowLeft, LuInfo, LuPhone, LuSparkles, LuTrash2, LuVideo } from 'react-icons/lu'
import useConversation from '../../Zustand/UserConversation'
import { useSocket } from '../../context/SocketProvider'
import { useCall } from '../../context/CallProvider'
import Avatar, { GroupAvatar } from '../Avatar'
import { useAuth } from '../../context/AuthProvider'

const iconBtn =
  'flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'

// Header of the open conversation.
const ChatUser = ({ onBack, onToggleInfo, infoOpen, onClear }) => {
  const { selectedConversation, typingUsers, catchUp, setCatchUp, nexaThinking } = useConversation()
  const { onlineUsers } = useSocket()
  const { call, startCall } = useCall()
  const [AuthUser] = useAuth()
  if (!selectedConversation) return null

  const isSelf = !!selectedConversation.isSelf
  const isGroup = !!selectedConversation.isGroup
  const typing = nexaThinking[String(selectedConversation._id)] ? 'Nexa' : typingUsers[String(selectedConversation._id)]

  // "You, Priya, Arjun and 3 others" under a group's name
  const memberLine = () => {
    const names = (selectedConversation.members || [])
      .map((m) => (String(m._id) === String(AuthUser?._id) ? 'You' : m.fullName?.split(' ')[0]))
      .filter(Boolean)
      .sort((a, b) => (a === 'You' ? -1 : b === 'You' ? 1 : a.localeCompare(b)))
    return names.length > 4 ? `${names.slice(0, 4).join(', ')} and ${names.length - 4} more` : names.join(', ')
  }
  const isOnline = !isSelf && onlineUsers.map(String).includes(String(selectedConversation._id))

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-5 dark:border-slate-800 dark:bg-slate-950">
      <button onClick={onBack} className={`${iconBtn} md:hidden`} aria-label="Back to chats">
        <LuArrowLeft className="size-5" />
      </button>

      <button onClick={onToggleInfo} className="flex min-w-0 items-center gap-3 rounded-lg py-1 pr-2 text-left">
        {isGroup
          ? <GroupAvatar name={selectedConversation.name} announcement={selectedConversation.announcement} size="sm" />
          : <Avatar name={selectedConversation.fullName} src={selectedConversation.avatar?.url} size="sm" online={isOnline} />}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">
            {selectedConversation.fullName}
            {isGroup && selectedConversation.community && (
              <span className="ml-1.5 text-xs font-normal text-slate-400">· {selectedConversation.community.name}</span>
            )}
          </p>
          {isGroup ? (
            typing
              ? <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{typing === 'Nexa' ? 'Nexa is thinking…' : typeof typing === 'string' ? `${typing.split(' ')[0]} is typing…` : 'typing…'}</p>
              : <p className="truncate text-xs text-slate-500 dark:text-slate-400">{selectedConversation.announcement ? 'Only admins can post' : memberLine()}</p>
          ) : isSelf ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Message yourself</p>
          ) : typing ? (
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{typing === 'Nexa' ? 'Nexa is thinking…' : typeof typing === 'string' ? `${typing} is typing…` : 'typing…'}</p>
          ) : (
            <p className={`text-xs ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
          )}
        </div>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {catchUp?.chatId === String(selectedConversation._id) && !catchUp.open && (
          <button
            onClick={() => setCatchUp({ ...catchUp, open: true })}
            className="mr-1 inline-flex h-8 items-center gap-1.5 rounded-full bg-violet-50 px-3 text-xs font-medium text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30 dark:hover:bg-violet-500/20"
            title="Summarize what you missed"
          >
            <LuSparkles className="size-3.5" /> Catch me up · {catchUp.count} new
          </button>
        )}
        {!isSelf && !isGroup && (
          <>
            <button
              onClick={() => startCall(selectedConversation, 'voice')}
              disabled={!!call}
              className={`${iconBtn} disabled:opacity-40`}
              title="Voice call"
              aria-label="Voice call"
            >
              <LuPhone className="size-4.5" />
            </button>
            <button
              onClick={() => startCall(selectedConversation, 'video')}
              disabled={!!call}
              className={`${iconBtn} disabled:opacity-40`}
              title="Video call"
              aria-label="Video call"
            >
              <LuVideo className="size-4.5" />
            </button>
          </>
        )}
        {!isGroup && <button onClick={onClear} className={`${iconBtn} hover:bg-red-50! hover:text-red-600! dark:hover:bg-red-500/10! dark:hover:text-red-400!`} title="Clear chat" aria-label="Clear chat">
          <LuTrash2 className="size-4.5" />
        </button>}
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
