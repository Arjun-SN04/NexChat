import React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'motion/react'
import ChatLayout from './home/ChatLayout'
import Signup from './components/Signup'
import Login from './components/Login'
import HomePage from './components/HomePage'
import Profile from './components/Profile'
import { useAuth } from './context/AuthProvider'
import { PageTransition } from './components/ui'

// ── App ─────────────────────────────────────────────────────
const page = (el) => <PageTransition>{el}</PageTransition>

const App = () => {
  const [AuthUser] = useAuth()
  const location = useLocation()

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
        <Routes location={location} key={location.pathname}>
          <Route path='/home' element={page(<HomePage />)} />
          <Route path='/' element={AuthUser ? page(<ChatLayout />) : <Navigate to="/home" />} />
          <Route path='/signup' element={AuthUser ? <Navigate to="/" /> : page(<Signup />)} />
          <Route path='/login' element={AuthUser ? <Navigate to="/" /> : page(<Login />)} />
          <Route path='/profile' element={AuthUser ? page(<Profile />) : <Navigate to="/login" />} />
          <Route path='*' element={<Navigate to={AuthUser ? '/' : '/home'} />} />
        </Routes>
      </AnimatePresence>
    </MotionConfig>
  )
}

export default App
