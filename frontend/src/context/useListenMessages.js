import { useEffect, useRef } from 'react'
import { useSocket } from './SocketProvider'
import useConversation from '../Zustand/UserConversation'

const useListenMessages = () => {
  const { socket } = useSocket()
  const { setMessages, selectedConversation, addUnread } = useConversation()

  // Keep a ref so socket handlers always read the LATEST selectedConversation
  // without needing to re-register listeners every time it changes
  const selectedConvRef = useRef(selectedConversation)
  useEffect(() => {
    selectedConvRef.current = selectedConversation
  }, [selectedConversation])

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (newMessage) => {
      const senderId    = newMessage.senderId?.toString()
      const activeChatId = selectedConvRef.current?._id?.toString()

      if (activeChatId && senderId === activeChatId) {
        // Message is from the currently open chat — show it immediately
        setMessages((prev) => [...prev, newMessage])
      } else {
        // Message is from someone else — show notification badge
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
      if (selectedConvRef.current?._id?.toString() === otherUserId?.toString()) {
        setMessages([])
      }
    }

    socket.on('newMessage',           handleNewMessage)
    socket.on('messageDeleted',       handleMessageDeleted)
    socket.on('messageEdited',        handleMessageEdited)
    socket.on('conversationDeleted',  handleConversationDeleted)

    return () => {
      socket.off('newMessage',          handleNewMessage)
      socket.off('messageDeleted',      handleMessageDeleted)
      socket.off('messageEdited',       handleMessageEdited)
      socket.off('conversationDeleted', handleConversationDeleted)
    }
    // Only re-register if socket changes — NOT on selectedConversation change
    // because we use a ref for that
  }, [socket, setMessages, addUnread])
}

export default useListenMessages
