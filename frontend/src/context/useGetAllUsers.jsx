import { useEffect, useState } from 'react'
import axios from 'axios'
import { useSocket } from './SocketProvider'
import useConversation from '../Zustand/UserConversation'
import { loadRequests } from '../utils/contacts'

// Loads my contacts and contact requests, and keeps them in sync in real time.
const useGetAllUsers = () => {
  const contacts = useConversation((s) => s.contacts)
  const [loading, setLoading] = useState(false)
  const { socket } = useSocket()

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true)
      try {
        const res = await axios.get('/api/contacts', { withCredentials: true })
        useConversation.getState().setContacts(res.data.contacts)
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }
    }
    fetchContacts()
    loadRequests()
  }, [])

  useEffect(() => {
    if (!socket) return
    const store = () => useConversation.getState()

    // Someone accepted my request or used my invite link
    const handleContactAdded = (user) => {
      store().addContact(user)
      loadRequests()
    }
    const handleContactRemoved = ({ userId }) => store().removeContact(userId)

    // A contact changed their name, username or photo
    const handleUserUpdated = (updated) => {
      store().setContacts(store().contacts.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)))
      const { selectedConversation } = store()
      if (selectedConversation?._id === updated._id && !selectedConversation.isSelf) {
        useConversation.setState({ selectedConversation: { ...selectedConversation, ...updated } })
      }
    }

    socket.on('contactAdded', handleContactAdded)
    socket.on('contactRemoved', handleContactRemoved)
    socket.on('contactRequest', loadRequests)
    socket.on('contactRequestRemoved', loadRequests)
    socket.on('userUpdated', handleUserUpdated)
    return () => {
      socket.off('contactAdded', handleContactAdded)
      socket.off('contactRemoved', handleContactRemoved)
      socket.off('contactRequest', loadRequests)
      socket.off('contactRequestRemoved', loadRequests)
      socket.off('userUpdated', handleUserUpdated)
    }
  }, [socket])

  return [contacts, loading]
}

export default useGetAllUsers
