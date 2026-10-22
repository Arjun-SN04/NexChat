import React, { useMemo, useState } from 'react'
import { LuCheck, LuSearch } from 'react-icons/lu'
import Avatar from '../Avatar'

// Searchable list of people with checkboxes
const MemberPicker = ({ people, selected, onChange, emptyText = 'No one to add' }) => {
  const [query, setQuery] = useState('')
  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, '')
    return [...people]
      .filter((p) => !q || p.fullName?.toLowerCase().includes(q) || p.username?.includes(q))
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [people, query])

  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  if (!people.length) return <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>

  return (
    <div>
      <div className="relative">
        <LuSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>
      <div className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
        {list.map((p) => {
          const on = selected.includes(String(p._id))
          return (
            <button
              key={p._id}
              type="button"
              onClick={() => toggle(String(p._id))}
              aria-pressed={on}
              className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${on ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
            >
              <Avatar name={p.fullName} src={p.avatar?.url} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.fullName}</p>
                {p.username && <p className="truncate text-xs text-slate-500 dark:text-slate-400">@{p.username}</p>}
              </div>
              <span className={`flex size-5 items-center justify-center rounded-md border transition ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {on && <LuCheck className="size-3.5" />}
              </span>
            </button>
          )
        })}
        {!list.length && <p className="py-4 text-center text-sm text-slate-500">No matches</p>}
      </div>
    </div>
  )
}

export default MemberPicker
