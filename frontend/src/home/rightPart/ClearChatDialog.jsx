import React from 'react'
import axios from 'axios'
import ConfirmDialog from '../ConfirmDialog'
import useConversation from '../../Zustand/UserConversation'
import { loadConversations } from '../../utils/conversations'

// Confirmation dialog for deleting every message in the open conversation.
const ClearChatDialog = ({ open, onClose }) => {
  const { selectedConversation, setMessages } = useConversation()

  const clearChat = async () => {
    try {
      await axios.delete(`/api/message/conversation/${selectedConversation._id}`, { withCredentials: true })
      setMessages([])
      loadConversations()
      onClose()
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={clearChat}
      title="Clear this chat?"
      description={`All messages and files with ${selectedConversation?.fullName} will be permanently deleted for both of you.`}
      confirmLabel="Clear chat"
      busyLabel="Clearing…"
    />
  )
}

export default ClearChatDialog
