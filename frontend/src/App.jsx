import React from 'react'
import Left from './home/leftpart/Left'
import Right from './home/rightPart/Right'
import Signup from './components/Signup'
import Login from './components/Login'
import HomePage from './components/HomePage'
import Profile from './components/Profile'
import { useAuth } from './context/AuthProvider'
import { useTheme } from './context/ThemeProvider'
import { Navigate, Route, Routes } from 'react-router-dom'
import useConversation from './Zustand/UserConversation'

const ChatLayout = () => {
  const { dark } = useTheme()
  const { selectedConversation } = useConversation()

  return (
    <div
      className='flex h-screen overflow-hidden'
      style={{ background: dark ? '#0f172a' : '#eef1f8' }}
    >
      {/* Left panel: hidden on mobile when a conversation is selected */}
      <div className={`
        ${selectedConversation ? 'hidden md:flex' : 'flex'}
        w-full md:w-[280px] md:min-w-[240px] flex-col h-full
      `}>
        <Left />
      </div>

      {/* Right panel: hidden on mobile when no conversation is selected */}
      <div className={`
        ${selectedConversation ? 'flex' : 'hidden md:flex'}
        flex-1 flex-col h-full overflow-hidden
      `}>
        <Right />
      </div>
    </div>
  )
}

const App = () => {
  const [AuthUser] = useAuth()

  return (
    <Routes>
      <Route path='/home' element={<HomePage />} />
      <Route
        path='/'
        element={AuthUser ? <ChatLayout /> : <Navigate to="/home" />}
      />
      <Route path='/signup' element={AuthUser ? <Navigate to="/" /> : <Signup />} />
      <Route path='/login' element={AuthUser ? <Navigate to="/" /> : <Login />} />
      <Route path='/profile' element={AuthUser ? <Profile /> : <Navigate to="/login" />} />
    </Routes>
  )
}

export default App
