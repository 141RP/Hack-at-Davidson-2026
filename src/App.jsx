import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Home from './pages/Home'
import Swipe from './pages/Swipe'
import Profile from './pages/Profile'
import Friends from './pages/Friends'
import Notifications from './pages/Notifications'

function AuthenticatedApp() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-surface-dim">
        <Navbar />
        <main className="md:pt-16 pb-20 md:pb-4 h-screen md:h-auto">
          <div className="h-full md:h-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/swipe" element={<Swipe />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </AppProvider>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="text-center text-white">
        <div className="text-5xl mb-4 animate-bounce">🧳</div>
        <p className="text-lg font-medium opacity-80">Loading...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Login />

  return <AuthenticatedApp />
}
