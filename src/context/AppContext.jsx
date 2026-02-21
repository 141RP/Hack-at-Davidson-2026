import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, doc, getDoc, getDocs, setDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import { DESTINATIONS } from '../data/mockData'
import { seedUsers } from '../data/seedUsers'
import { GEMINI_USER_ID } from '../services/gemini'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [users, setUsers] = useState({})
  const [allUsers, setAllUsers] = useState([])
  const [swipeResults, setSwipeResults] = useState({})
  const [currentDestIdx, setCurrentDestIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const fetchedUsers = useRef(new Set())
  const seeded = useRef(false)

  useEffect(() => {
    if (user) {
      setUsers(prev => ({ ...prev, [user.id]: user }))
      fetchedUsers.current.add(user.id)
    }
  }, [user])

  useEffect(() => {
    if (!user || seeded.current) return
    seeded.current = true
    seedUsers().then(() => {
      getDocs(collection(db, 'users')).then(snapshot => {
        const userList = []
        snapshot.docs.forEach(d => {
          const u = { id: d.id, ...d.data() }
          userList.push(u)
          setUsers(prev => ({ ...prev, [d.id]: u }))
          fetchedUsers.current.add(d.id)
        })
        setAllUsers(userList)
      })
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'conversations'),
      where('members', 'array-contains', user.id),
    )
    const unsub = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      convs.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))
      setConversations(convs)

      const allMemberIds = [...new Set(convs.flatMap(c => c.members))]
      for (const uid of allMemberIds) {
        if (!fetchedUsers.current.has(uid)) {
          fetchedUsers.current.add(uid)
          getDoc(doc(db, 'users', uid)).then(snap => {
            if (snap.exists()) {
              setUsers(prev => ({ ...prev, [uid]: { id: uid, ...snap.data() } }))
            }
          })
        }
      }
      setLoading(false)
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(collection(db, 'users', user.id, 'swipes'), (snapshot) => {
      const results = {}
      snapshot.docs.forEach(d => { results[d.id] = d.data().direction })
      setSwipeResults(results)
      const swipedIds = new Set(Object.keys(results))
      const nextIdx = DESTINATIONS.findIndex(d => !swipedIds.has(d.id))
      setCurrentDestIdx(nextIdx === -1 ? DESTINATIONS.length : nextIdx)
    })
    return unsub
  }, [user])

  const sendMessage = useCallback(async (conversationId, text) => {
    if (!user) return
    const now = Date.now()
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      sender: user.id,
      text,
      time: now,
    })
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessageText: text,
      lastMessageSender: user.id,
      lastMessageTime: now,
    })
  }, [user])

  const updateConversationMembers = useCallback(async (conversationId, memberIds) => {
    await updateDoc(doc(db, 'conversations', conversationId), {
      members: memberIds,
    })
  }, [])

  const updateConversationName = useCallback(async (conversationId, name) => {
    await updateDoc(doc(db, 'conversations', conversationId), { name })
  }, [])

  const createConversation = useCallback(async (name, type, memberIds) => {
    if (!user) return null
    const base = [user.id, ...memberIds]
    if (type === 'group') base.push(GEMINI_USER_ID)
    const allMembers = [...new Set(base)]
    const ref = await addDoc(collection(db, 'conversations'), {
      name: name || '',
      type,
      members: allMembers,
      lastMessageText: '',
      lastMessageSender: '',
      lastMessageTime: Date.now(),
      createdAt: Date.now(),
    })
    return ref.id
  }, [user])

  const swipe = useCallback(async (destinationId, direction) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.id, 'swipes', destinationId), {
      direction,
      timestamp: Date.now(),
    })
  }, [user])

  const currentDestination = DESTINATIONS[currentDestIdx] || null

  return (
    <AppContext.Provider value={{
      conversations,
      users,
      allUsers,
      sendMessage,
      createConversation,
      updateConversationMembers,
      updateConversationName,
      swipeResults,
      swipe,
      currentDestination,
      currentDestIdx,
      totalDestinations: DESTINATIONS.length,
      destinations: DESTINATIONS,
      loading,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
