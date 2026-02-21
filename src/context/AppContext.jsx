import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, doc, getDoc, getDocs, setDoc, deleteDoc,
  arrayUnion, arrayRemove,
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

  const [friends, setFriends] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])

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

  // Listen to current user's friends array
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setFriends(data.friends || [])
      }
    })
    return unsub
  }, [user])

  // Listen to incoming friend requests (pending, sent TO me)
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'friendRequests'),
      where('to', '==', user.id),
      where('status', '==', 'pending'),
    )
    const unsub = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setIncomingRequests(reqs)
      for (const req of reqs) {
        if (!fetchedUsers.current.has(req.from)) {
          fetchedUsers.current.add(req.from)
          getDoc(doc(db, 'users', req.from)).then(snap => {
            if (snap.exists()) {
              setUsers(prev => ({ ...prev, [req.from]: { id: req.from, ...snap.data() } }))
            }
          })
        }
      }
    })
    return unsub
  }, [user])

  // Listen to outgoing friend requests (pending, sent BY me)
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'friendRequests'),
      where('from', '==', user.id),
      where('status', '==', 'pending'),
    )
    const unsub = onSnapshot(q, (snapshot) => {
      setSentRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user])

  const sendFriendRequest = useCallback(async (targetUserId) => {
    if (!user) return
    await addDoc(collection(db, 'friendRequests'), {
      from: user.id,
      to: targetUserId,
      status: 'pending',
      createdAt: Date.now(),
    })
  }, [user])

  const acceptFriendRequest = useCallback(async (requestId, fromUserId) => {
    if (!user) return
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' })
    await updateDoc(doc(db, 'users', user.id), { friends: arrayUnion(fromUserId) })
    await updateDoc(doc(db, 'users', fromUserId), { friends: arrayUnion(user.id) })
  }, [user])

  const denyFriendRequest = useCallback(async (requestId) => {
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'denied' })
  }, [])

  const removeFriend = useCallback(async (friendId) => {
    if (!user) return
    await updateDoc(doc(db, 'users', user.id), { friends: arrayRemove(friendId) })
    await updateDoc(doc(db, 'users', friendId), { friends: arrayRemove(user.id) })
  }, [user])

  const updateBio = useCallback(async (bio) => {
    if (!user) return
    await updateDoc(doc(db, 'users', user.id), { bio })
    setUsers(prev => ({ ...prev, [user.id]: { ...prev[user.id], bio } }))
  }, [user])

  const getUserSwipes = useCallback(async (userId) => {
    const snapshot = await getDocs(collection(db, 'users', userId, 'swipes'))
    const results = {}
    snapshot.docs.forEach(d => { results[d.id] = d.data().direction })
    return results
  }, [])

  const getUserFriends = useCallback(async (userId) => {
    const snap = await getDoc(doc(db, 'users', userId))
    if (snap.exists()) {
      return snap.data().friends || []
    }
    return []
  }, [])

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

  const leaveConversation = useCallback(async (conversationId) => {
    if (!user) return
    await updateDoc(doc(db, 'conversations', conversationId), {
      members: arrayRemove(user.id),
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
    const sortedNew = [...allMembers].sort()

    const q = query(
      collection(db, 'conversations'),
      where('members', 'array-contains', user.id),
    )
    const snap = await getDocs(q)
    for (const d of snap.docs) {
      const sortedExisting = [...(d.data().members || [])].sort()
      if (sortedExisting.length === sortedNew.length &&
          sortedExisting.every((id, i) => id === sortedNew[i])) {
        return d.id
      }
    }

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
      leaveConversation,
      updateConversationMembers,
      updateConversationName,
      swipeResults,
      swipe,
      currentDestination,
      currentDestIdx,
      totalDestinations: DESTINATIONS.length,
      destinations: DESTINATIONS,
      loading,
      friends,
      incomingRequests,
      sentRequests,
      sendFriendRequest,
      acceptFriendRequest,
      denyFriendRequest,
      removeFriend,
      updateBio,
      getUserSwipes,
      getUserFriends,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
