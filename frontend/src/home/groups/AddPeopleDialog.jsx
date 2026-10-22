import React, { useEffect, useState } from 'react'
import Sheet from './Sheet'
import MemberPicker from './MemberPicker'
import { errorOf } from '../../utils/groups'

// Pick people from `pool` and pass their ids to `onAdd`
const AddPeopleDialog = ({ open, onClose, title, pool, onAdd, emptyText }) => {
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (open) { setSelected([]); setError('') } }, [open])

  const submit = async () => {
    if (!selected.length) return
    setBusy(true)
    setError('')
    try {
      await onAdd(selected)
      onClose()
    } catch (err) {
      setError(errorOf(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
          <button onClick={submit} disabled={busy || !selected.length} className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50">
            {busy ? 'Adding…' : `Add${selected.length ? ` ${selected.length}` : ''}`}
          </button>
        </div>
      }
    >
      <MemberPicker people={pool} selected={selected} onChange={setSelected} emptyText={emptyText} />
    </Sheet>
  )
}

export default AddPeopleDialog
