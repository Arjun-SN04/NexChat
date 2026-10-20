import { useEffect } from 'react'
import { useSocket } from './SocketProvider'
import useConversation from '../Zustand/UserConversation'
import { loadConversations, markSeen } from '../utils/conversations'

// Typing indicators clear themselves if no "stopTyping" arrives in time
const TYPING_TIMEOUT_MS = 4000
const typingTimers = {}

// Listens to all real-time chat events for the signed-in user.
// Mounted once by the chat layout so it works even when no chat is open.
const useListenMessages = () => {
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return
    const store = () => useConversation.getState()
    const openChatId = () => store().selectedConversation?._id?.toString()

    const stopTyping = (from) => {
      clearTimeout(typingTimers[from])
      store().setTyping(from, false)
    }

    const handleNewMessage = (newMessage) => {
      const senderId = newMessage.senderId?.toString()
      stopTyping(senderId)
      store().upsertPreview(senderId, newMessage)

      if (senderId === openChatId()) {
        // From the open chat: show it, and mark it read if I'm looking at the page
        store().setMessages((prev) => [...prev, newMessage])
        if (document.visibilityState === 'visible') markSeen(senderId)
      } else {
        store().addUnread(senderId)
      }
    }

    const handleMessageDeleted = (messageId) => {
      store().setMessages((prev) => prev.filter((m) => m._id !== messageId))
      loadConversations()
    }

    const handleMessagesDeleted = (ids) => {
      const gone = new Set(ids)
      store().setMessages((prev) => prev.filter((m) => !gone.has(m._id)))
      loadConversations()
    }

    const handleMessageReacted = ({ messageId, reactions }) => {
      store().setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)))
    }

    const handleMessageEdited = (updated) => {
      store().setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)))
      loadConversations()
    }

    const handleConversationDeleted = ({ otherUserId }) => {
      if (openChatId() === otherUserId?.toString()) store().setMessages([])
      loadConversations()
    }

    // The other person opened our chat: mark my messages to them as seen
    const handleMessagesSeen = ({ by }) => {
      store().setMessages((prev) =>
        prev.map((m) => (String(m.receiverId) === String(by) && !m.seen ? { ...m, seen: true } : m)))
    }

    const handleTyping = ({ from }) => {
      store().setTyping(from, true)
      clearTimeout(typingTimers[from])
      typingTimers[from] = setTimeout(() => store().setTyping(from, false), TYPING_TIMEOUT_MS)
    }
    const handleStopTyping = ({ from }) => stopTyping(from)

    socket.on('newMessage', handleNewMessage)
    socket.on('messageDeleted', handleMessageDeleted)
    socket.on('messageEdited', handleMessageEdited)
    socket.on('messagesDeleted', handleMessagesDeleted)
    socket.on('messageReacted', handleMessageReacted)
    socket.on('conversationDeleted', handleConversationDeleted)
    socket.on('messagesSeen', handleMessagesSeen)
    socket.on('typing', handleTyping)
    socket.on('stopTyping', handleStopTyping)

    return () => {
      socket.off('newMessage', handleNewMessage)
      socket.off('messageDeleted', handleMessageDeleted)
      socket.off('messageEdited', handleMessageEdited)
      socket.off('messagesDeleted', handleMessagesDeleted)
      socket.off('messageReacted', handleMessageReacted)
      socket.off('conversationDeleted', handleConversationDeleted)
      socket.off('messagesSeen', handleMessagesSeen)
      socket.off('typing', handleTyping)
      socket.off('stopTyping', handleStopTyping)
    }
  }, [socket])
}

export default useListenMessages
