import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const userData = {
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || `https://api.dicebear.com/9.x/adventurer/svg?seed=${firebaseUser.uid}`,
        }

        const snap = await getDoc(userRef)
        if (!snap.exists()) {
          await setDoc(userRef, { ...userData, createdAt: Date.now() })
        } else {
          await setDoc(userRef, userData, { merge: true })
        }

        setUser({ id: firebaseUser.uid, ...userData })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Login failed:', err)
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
