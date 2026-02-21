import { createContext, useContext, useState, useCallback } from 'react'
import { USERS } from '../data/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('wanderswipe_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = useCallback(() => {
    const currentUser = USERS.u1
    setUser(currentUser)
    localStorage.setItem('wanderswipe_user', JSON.stringify(currentUser))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('wanderswipe_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
