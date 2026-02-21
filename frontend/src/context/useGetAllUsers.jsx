import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import axios from 'axios'
import { useSocket } from './SocketProvider'

const useGetAllUsers = () => {
  const [allUser, setAllUser] = useState([])
  const [loading, setLoading] = useState(false)
  const { socket } = useSocket()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = Cookies.get('jwt')
      const response = await axios.get('/api/user/allusers', {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      })
      setAllUser(response.data.allUsers)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchUsers()
  }, [])

  // When a brand-new user signs up, the backend emits "newUserJoined"
  // → append them to the list instantly without a full re-fetch
  useEffect(() => {
    if (!socket) return

    const handleNewUser = (newUser) => {
      setAllUser((prev) => {
        // avoid duplicates
        if (prev.some((u) => u._id === newUser._id)) return prev
        return [...prev, newUser]
      })
    }

    socket.on('newUserJoined', handleNewUser)
    return () => socket.off('newUserJoined', handleNewUser)
  }, [socket])

  return [allUser, loading]
}

export default useGetAllUsers
