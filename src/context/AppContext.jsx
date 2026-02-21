import { createContext, useContext, useState, useCallback } from 'react'
import { CONVERSATIONS, DESTINATIONS } from '../data/mockData'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [conversations, setConversations] = useState(CONVERSATIONS)
  const [swipeResults, setSwipeResults] = useState({})
  const [currentDestIdx, setCurrentDestIdx] = useState(0)

  const sendMessage = useCallback((conversationId, text, senderId) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c
      const newMsg = {
        id: `m${Date.now()}`,
        sender: senderId,
        text,
        time: Date.now(),
      }
      return {
        ...c,
        messages: [...c.messages, newMsg],
        lastMessage: { text, sender: senderId, time: Date.now() },
      }
    }))
  }, [])

  const swipe = useCallback((destinationId, direction) => {
    setSwipeResults(prev => ({ ...prev, [destinationId]: direction }))
    setCurrentDestIdx(prev => Math.min(prev + 1, DESTINATIONS.length))
  }, [])

  const currentDestination = DESTINATIONS[currentDestIdx] || null

  return (
    <AppContext.Provider value={{
      conversations,
      sendMessage,
      swipeResults,
      swipe,
      currentDestination,
      currentDestIdx,
      totalDestinations: DESTINATIONS.length,
      destinations: DESTINATIONS,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
