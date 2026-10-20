import React from 'react'
import { Link } from 'react-router-dom'
import { LuMoon, LuSettings, LuSun } from 'react-icons/lu'
import Users from './Users'
import Logout from './Logout'
import Avatar from '../Avatar'
import { LogoMark } from '../../components/ui'
import { useAuth } from '../../context/AuthProvider'
import { useTheme } from '../../context/ThemeProvider'

const iconBtn =
  'flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'

const Left = () => {
  const [AuthUser] = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pb-4 pt-5">
        <Link to="/home" className="flex items-center gap-2.5" title="NexChat home">
          <LogoMark className="size-8" />
          <span className="text-lg font-semibold tracking-tight">Chats</span>
        </Link>
        <button onClick={toggle} className={iconBtn} title={dark ? 'Light mode' : 'Dark mode'} aria-label="Toggle theme">
          {dark ? <LuSun className="size-4.5" /> : <LuMoon className="size-4.5" />}
        </button>
      </header>

      <Users />

      {/* Signed-in user */}
      <footer className="flex items-center gap-3 border-t border-slate-200 p-3 dark:border-slate-800">
        <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-900">
          <Avatar name={AuthUser?.fullName} src={AuthUser?.avatar?.url} size="sm" online />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{AuthUser?.fullName}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{AuthUser?.email}</p>
          </div>
        </Link>
        <Link to="/profile" className={iconBtn} title="Settings" aria-label="Settings">
          <LuSettings className="size-4.5" />
        </Link>
        <Logout />
      </footer>
    </div>
  )
}

export default Left
