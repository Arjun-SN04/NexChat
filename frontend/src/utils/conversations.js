import axios from 'axios'
import useConversation from '../Zustand/UserConversation'

// Load the sidebar summary (last message + unread count per contact) from the server.
export const loadConversations = async () => {
  try {
    const res = await axios.get('/api/message/conversations', { withCredentials: true })
    const previews = {}
    const unread = {}
    res.data.forEach((c) => {
      if (c.lastMessage) previews[c.userId] = c.lastMessage
      if (c.unread) unread[c.userId] = c.unread
    })
    const store = useConversation.getState()
    const openId = store.selectedConversation?._id
    if (openId) delete unread[String(openId)]
    store.setPreviews(previews)
    store.setUnreadCounts(unread)
  } catch (err) {
    console.log('loadConversations error:', err)
  }
}

// Tell the server I've read everything from this person.
export const markSeen = (userId) =>
  axios.put(`/api/message/seen/${userId}`, {}, { withCredentials: true }).catch(() => {})

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
