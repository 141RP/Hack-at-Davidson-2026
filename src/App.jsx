import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Home from './pages/Home'
import Swipe from './pages/Swipe'
import Profile from './pages/Profile'

function AuthenticatedApp() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-surface-dim">
        <Navbar />
        <main className="md:pt-16 pb-20 md:pb-4 h-screen md:h-auto">
          <div className="h-full md:h-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/swipe" element={<Swipe />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </AppProvider>
  )
}

export default function App() {
  const { user } = useAuth()

  if (!user) return <Login />

  return <AuthenticatedApp />
}
