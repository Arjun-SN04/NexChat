import React, { useEffect, useState } from 'react'
import { LuLayers, LuUsers } from 'react-icons/lu'
import useConversation from '../../Zustand/UserConversation'
import Sheet from './Sheet'
import MemberPicker from './MemberPicker'
import { communitiesApi, errorOf, groupsApi, loadCommunities } from '../../utils/groups'
import { useAuth } from '../../context/AuthProvider'

const COPY = {
  group: { title: 'New group', Icon: LuUsers, cta: 'Create group', hint: 'Pick at least one contact.' },
  community: {
    title: 'New community',
    Icon: LuLayers,
    cta: 'Create community',
    hint: 'A community brings related groups together. Everyone gets an Announcements group where only admins post, and can join the other groups.',
  },
  communityGroup: { title: 'New group in community', Icon: LuUsers, cta: 'Create group', hint: 'Other members can join it from the community page.' },
}

const inputCls = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950'

// Create a group, a community, or a group inside a community
const CreateGroupDialog = () => {
  const { createDialog, setCreateDialog, contacts, upsertGroup, setSelectedConversation } = useConversation()
  const [AuthUser] = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState([])
  const [pool, setPool] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const mode = createDialog?.mode
  const communityId = createDialog?.community?._id

  // Reset each time it opens; community groups pick from the community's members
  useEffect(() => {
    if (!mode) return
    setName(''); setDescription(''); setSelected([]); setError('')
    if (mode === 'communityGroup') {
      setPool([])
      communitiesApi.get(communityId)
        .then((res) => setPool(res.data.members.filter((m) => String(m._id) !== String(AuthUser?._id))))
        .catch((err) => setError(errorOf(err)))
    } else {
      setPool(contacts)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, communityId])

  const close = () => setCreateDialog(null)
  const copy = COPY[mode] || COPY.group

  const submit = async (e) => {
    e?.preventDefault()
    if (!name.trim()) return setError('Give it a name')
    if (mode === 'group' && !selected.length) return setError('Pick at least one contact')
    setBusy(true)
    setError('')
    try {
      const body = { name, description, memberIds: selected }
      if (mode === 'community') {
        const res = await communitiesApi.create(body)
        await loadCommunities()
        setSelectedConversation(res.data)
      } else {
        const res = mode === 'communityGroup' ? await communitiesApi.createGroup(communityId, body) : await groupsApi.create(body)
        upsertGroup(res.data)
        if (mode === 'communityGroup') loadCommunities()
        setSelectedConversation(res.data)
      }
      close()
    } catch (err) {
      setError(errorOf(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={!!mode}
      onClose={close}
      title={copy.title}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">{selected.length ? `${selected.length} selected` : ''}</span>
          <button
            onClick={submit}
            disabled={busy}
            className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? 'Creating…' : copy.cta}
          </button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
          <copy.Icon className="mt-0.5 size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          {createDialog?.community ? <span><b>{createDialog.community.name}</b>. {copy.hint}</span> : copy.hint}
        </div>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={mode === 'community' ? 'Community name' : 'Group name'} className={inputCls} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="Description (optional)" className={inputCls} />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {mode === 'communityGroup' ? 'Add community members' : mode === 'community' ? 'Invite contacts (optional)' : 'Add contacts'}
        </p>
        <MemberPicker
          people={pool}
          selected={selected}
          onChange={setSelected}
          emptyText={mode === 'communityGroup' ? 'No other members yet. You can still create the group.' : 'Add some contacts first.'}
        />
      </form>
    </Sheet>
  )
}

export default CreateGroupDialog
