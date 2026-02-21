import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import ChatView from '../components/ChatView'
import NewChatModal from '../components/NewChatModal'

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function Home() {
  const { conversations, users, loading } = useApp()
  const { user } = useAuth()
  const [activeChat, setActiveChat] = useState(null)
  const [showNewChat, setShowNewChat] = useState(false)

  if (activeChat) {
    return <ChatView conversation={activeChat} onBack={() => setActiveChat(null)} />
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 pt-4 pb-2 md:pt-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Messages</h1>
          <p className="text-sm text-text-secondary mt-1">Plan your next adventure</p>
        </div>
        <button
          onClick={() => setShowNewChat(true)}
          className="p-2.5 rounded-2xl bg-primary text-white hover:bg-primary-dark transition cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-text-secondary">Loading chats...</p>
          </div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20 px-4">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-lg font-semibold mb-1">No conversations yet</h2>
          <p className="text-sm text-text-secondary mb-4">Start a chat to plan your next trip!</p>
          <button
            onClick={() => setShowNewChat(true)}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-medium hover:bg-primary-dark transition cursor-pointer"
          >
            New Chat
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {conversations.map(conv => {
            const otherMembers = conv.members.filter(id => id !== user.id)
            const displayName = conv.type === 'group'
              ? conv.name
              : users[otherMembers[0]]?.name || 'User'
            const avatar = conv.type === 'group'
              ? null
              : users[otherMembers[0]]?.avatar
            const senderName = conv.lastMessageSender === user.id
              ? 'You'
              : users[conv.lastMessageSender]?.name?.split(' ')[0] || ''

            return (
              <button
                key={conv.id}
                onClick={() => setActiveChat(conv)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left cursor-pointer"
              >
                {conv.type === 'group' ? (
                  <div className="relative flex-shrink-0 w-12 h-12">
                    <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-primary/20 border-2 border-white overflow-hidden">
                      <img src={users[otherMembers[0]]?.avatar} alt="" className="w-full h-full" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent/20 border-2 border-white overflow-hidden">
                      <img src={users[otherMembers[1]]?.avatar} alt="" className="w-full h-full" />
                    </div>
                  </div>
                ) : (
                  <img src={avatar} alt="" className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200" referrerPolicy="no-referrer" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-text-primary truncate">{displayName}</h3>
                    <span className="text-xs text-text-secondary flex-shrink-0 ml-2">
                      {timeAgo(conv.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary truncate mt-0.5">
                    {conv.lastMessageText
                      ? `${conv.type === 'group' && senderName ? `${senderName}: ` : ''}${conv.lastMessageText}`
                      : 'No messages yet'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </div>
  )
}
