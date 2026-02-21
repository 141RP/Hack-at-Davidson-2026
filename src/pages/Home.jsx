import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { USERS } from '../data/mockData'
import ChatView from '../components/ChatView'

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function Home() {
  const { conversations } = useApp()
  const { user } = useAuth()
  const [activeChat, setActiveChat] = useState(null)

  if (activeChat) {
    return <ChatView conversation={activeChat} onBack={() => setActiveChat(null)} />
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 pt-4 pb-2 md:pt-6">
        <h1 className="text-2xl font-bold text-text-primary">Messages</h1>
        <p className="text-sm text-text-secondary mt-1">Plan your next adventure</p>
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

      <div className="divide-y divide-gray-100">
        {conversations.map(conv => {
          const otherMembers = conv.members.filter(id => id !== user.id)
          const displayName = conv.type === 'group'
            ? conv.name
            : USERS[otherMembers[0]]?.name
          const avatar = conv.type === 'group'
            ? null
            : USERS[otherMembers[0]]?.avatar
          const senderName = conv.lastMessage.sender === user.id
            ? 'You'
            : USERS[conv.lastMessage.sender]?.name?.split(' ')[0]

          return (
            <button
              key={conv.id}
              onClick={() => setActiveChat(conv)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left cursor-pointer"
            >
              {conv.type === 'group' ? (
                <div className="relative flex-shrink-0 w-12 h-12">
                  <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-primary/20 border-2 border-white overflow-hidden">
                    <img src={USERS[otherMembers[0]]?.avatar} alt="" className="w-full h-full" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent/20 border-2 border-white overflow-hidden">
                    <img src={USERS[otherMembers[1]]?.avatar} alt="" className="w-full h-full" />
                  </div>
                </div>
              ) : (
                <img src={avatar} alt="" className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-text-primary truncate">{displayName}</h3>
                  <span className="text-xs text-text-secondary flex-shrink-0 ml-2">
                    {timeAgo(conv.lastMessage.time)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary truncate mt-0.5">
                  {conv.type === 'group' && `${senderName}: `}{conv.lastMessage.text}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
