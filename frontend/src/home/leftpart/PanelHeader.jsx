import React from 'react'

export const panelIconBtn =
  'flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'

// Title row at the top of each sidebar panel (Chats, Calls, Communities)
const PanelHeader = ({ title, children }) => (
  <header className="flex items-center justify-between px-4 pb-4 pt-5">
    <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
    <div className="flex items-center gap-1">{children}</div>
  </header>
)

export default PanelHeader
