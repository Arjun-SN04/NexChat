import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import AuthProvider from './context/AuthProvider.jsx'
import SocketProvider from './context/SocketProvider.jsx'
import ThemeProvider from './context/ThemeProvider.jsx'
import CallProvider from './context/CallProvider.jsx'
import axios from 'axios'

// Tell the server the user's time zone (Nexa uses it for times like "tomorrow 9am")
try { axios.defaults.headers.common['X-Time-Zone'] = Intl.DateTimeFormat().resolvedOptions().timeZone } catch { /* ignore */ }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <CallProvider>
              <App />
            </CallProvider>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
