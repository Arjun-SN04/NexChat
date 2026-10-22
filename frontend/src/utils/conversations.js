import axios from 'axios'
import useConversation from '../Zustand/UserConversation'

// Load the sidebar summary (last message + unread count per chat and group) from the server.
export const loadConversations = async () => {
  try {
    const [direct, groups] = await Promise.all([
      axios.get('/api/message/conversations', { withCredentials: true }),
      axios.get('/api/groups', { withCredentials: true }),
    ])
    const previews = {}
    const unread = {}
    direct.data.forEach((c) => {
      if (c.lastMessage) previews[c.userId] = c.lastMessage
      if (c.unread) unread[c.userId] = c.unread
    })
    groups.data.groups.forEach((g) => {
      if (g.lastMessage) previews[g._id] = g.lastMessage
      if (g.unread) unread[g._id] = g.unread
    })
    const store = useConversation.getState()
    store.setGroups(groups.data.groups)
    const openId = store.selectedConversation?._id
    if (openId) delete unread[String(openId)]
    store.setPreviews(previews)
    store.setUnreadCounts(unread)
  } catch (err) {
    console.log('loadConversations error:', err)
  }
}

// The "message yourself" contact, pinned at the top of the chat list.
export const selfContact = (authUser) =>
  authUser ? { ...authUser, fullName: `${authUser.fullName} (You)`, isSelf: true } : null

// Tell the server I've read everything from this person (or in this group).
export const markSeen = (id, isGroup = false) =>
  axios.put(isGroup ? `/api/groups/${id}/read` : `/api/message/seen/${id}`, {}, { withCredentials: true }).catch(() => {})

// Short time label for the sidebar: "14:05", "Yesterday" or "12/03/26"
export const shortTime = (date) => {
  const d = new Date(date)
  const now = new Date()
  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })
}
