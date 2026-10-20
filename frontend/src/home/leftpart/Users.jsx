import React, { useEffect, useMemo, useRef, useState } from 'react'
import { LuSearch, LuSearchX, LuX } from 'react-icons/lu'
import User from './User'
import useGetAllUsers from '../../context/useGetAllUsers'
import { useSocket } from '../../context/SocketProvider'
import useConversation from '../../Zustand/UserConversation'
import { useAuth } from '../../context/AuthProvider'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'online', label: 'Online' },
  { id: 'unread', label: 'Unread' },
]

const RowSkeleton = () => (
  <div className="flex items-center gap-3 px-3 py-2.5">
    <div className="size-11 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      <div className="h-2.5 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
    </div>
  </div>
)

const Users = () => {
  const [allUser, loading] = useGetAllUsers()
  const { onlineUsers } = useSocket()
  const { unreadCounts, setContacts, previews, typingUsers } = useConversation()
  const [AuthUser] = useAuth()
  const myId = String(AuthUser?._id)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const searchRef = useRef(null)

  // Share the contact list with the welcome screen
  useEffect(() => { setContacts(allUser) }, [allUser, setContacts])

  // Press "/" anywhere to jump to search
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onlineSet = useMemo(() => new Set(onlineUsers.map(String)), [onlineUsers])
  const unreadOf = (u) => unreadCounts[String(u._id)] || 0
  const lastTime = (u) => (previews[String(u._id)] ? new Date(previews[String(u._id)].createdAt).getTime() : 0)

  const counts = {
    all: allUser.length,
    online: allUser.filter((u) => onlineSet.has(String(u._id))).length,
    unread: allUser.filter((u) => unreadOf(u) > 0).length,
  }

  // Filter by search + tab, then sort by most recent chat (people you haven't talked to go last, A→Z)
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allUser
      .filter((u) => !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .filter((u) => tab === 'all' || (tab === 'online' ? onlineSet.has(String(u._id)) : unreadOf(u) > 0))
      .sort((a, b) => lastTime(b) - lastTime(a) || a.fullName.localeCompare(b.fullName))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUser, query, tab, onlineSet, unreadCounts, previews])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && (setQuery(''), e.currentTarget.blur())}
            placeholder="Search people"
            className="h-10 w-full rounded-xl border border-transparent bg-slate-100 pl-9 pr-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500/50 dark:focus:bg-slate-950"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <LuX className="size-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 text-[11px] font-medium text-slate-400 md:block dark:border-slate-700 dark:bg-slate-800">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex gap-1 px-4">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
              tab === id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
            }`}
          >
            {label}
            <span className={`text-xs ${tab === id ? 'opacity-70' : 'text-slate-400'}`}>{counts[id]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {loading && allUser.length === 0 ? (
          Array.from({ length: 6 }, (_, i) => <RowSkeleton key={i} />)
        ) : list.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <LuSearchX className="mx-auto size-6 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              {query ? 'No matches' : tab === 'online' ? 'Nobody is online' : tab === 'unread' ? "You're all caught up" : 'No contacts yet'}
            </p>
            <p className="mt-1 text-[13px] text-slate-400">
              {query ? 'Try a different name or email.' : 'Check back in a bit.'}
            </p>
          </div>
        ) : (
          list.map((user) => (
            <User
              key={user._id}
              user={user}
              online={onlineSet.has(String(user._id))}
              unread={unreadOf(user)}
              preview={previews[String(user._id)]}
              typing={!!typingUsers[String(user._id)]}
              myId={myId}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default Users
