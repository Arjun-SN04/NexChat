import { useEffect } from 'react'
import { useSocket } from './SocketProvider'
import useConversation from '../Zustand/UserConversation'

const useListenMessages = () => {
  const { socket } = useSocket()
  const {
    setMessages,
    selectedConversation,
    addUnread,
  } = useConversation()

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (newMessage) => {
      const senderId = newMessage.senderId?.toString()
      const activeChatId = selectedConversation?._id?.toString()

      if (senderId === activeChatId) {
        // Message is from the currently open conversation → append directly
        setMessages((prev) => [...prev, newMessage])
      } else {
        // Message is from someone else → increment their unread badge
        addUnread(senderId)
      }
    }

    const handleMessageDeleted = (messageId) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId))
    }

    const handleMessageEdited = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      )
    }

    const handleConversationDeleted = ({ otherUserId }) => {
      if (selectedConversation?._id?.toString() === otherUserId?.toString()) {
        setMessages([])
      }
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('messageDeleted', handleMessageDeleted)
    socket.on('messageEdited', handleMessageEdited)
    socket.on('conversationDeleted', handleConversationDeleted)

    return () => {
      socket.off('newMessage', handleNewMessage)
      socket.off('messageDeleted', handleMessageDeleted)
      socket.off('messageEdited', handleMessageEdited)
      socket.off('conversationDeleted', handleConversationDeleted)
    }
  }, [socket, selectedConversation, setMessages, addUnread])
}

export default useListenMessages
