import React, { useState, useMemo } from 'react'
import User from './User'
import useGetAllUsers from '../../context/useGetAllUsers'
import { useTheme } from '../../context/ThemeProvider'

const Users = () => {
  const [allUser, loading] = useGetAllUsers()
  const [query, setQuery] = useState('')
  const { dark } = useTheme()

  const filtered = useMemo(() =>
    query.trim()
      ? allUser.filter(u =>
          u.fullName.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()))
      : allUser,
    [allUser, query])

  const inputBg     = dark ? '#1a2235' : '#f1f5f9'
  const inputBorder = dark ? '#2a3347' : '#e2e8f0'
  const inputColor  = dark ? '#e2e8f0' : '#1e293b'
  const labelColor  = dark ? '#475569' : '#94a3b8'

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search */}
      <div className="px-3 pt-1 pb-1.5">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: dark ? '#475569' : '#94a3b8' }}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full pl-8 pr-7 py-1.5 rounded-lg text-[12px] focus:outline-none transition"
            style={{ background: inputBg, color: inputColor, border: `1px solid ${inputBorder}` }}
            onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
            onBlur={e => e.currentTarget.style.borderColor = inputBorder}
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 transition"
              style={{ color: dark ? '#475569' : '#94a3b8' }}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Label */}
      <div className="px-3 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: labelColor }}>
          {query ? `${filtered.length} found` : `All · ${allUser.length}`}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-2xl mb-1.5">🔍</p>
            <p className="text-[12px]" style={{ color: labelColor }}>No contacts found</p>
          </div>
        ) : (
          filtered.map((user, idx) => <User key={idx} user={user} />)
        )}
      </div>
    </div>
  )
}

export default Users
