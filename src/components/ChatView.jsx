import { useState, useRef, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

export default function ChatView({ conversation, onBack }) {
  const { sendMessage, users } = useApp()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  const otherMembers = conversation.members.filter(id => id !== user.id)
  const displayName = conversation.type === 'group'
    ? conversation.name
    : users[otherMembers[0]]?.name || 'User'

  useEffect(() => {
    const q = query(
      collection(db, 'conversations', conversation.id, 'messages'),
      orderBy('time', 'asc'),
    )
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [conversation.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(conversation.id, text.trim())
    setText('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <button onClick={onBack} className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        {conversation.type === 'group' ? (
          <div className="flex -space-x-2">
            {otherMembers.slice(0, 3).map(id => (
              <img key={id} src={users[id]?.avatar} alt="" className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" referrerPolicy="no-referrer" />
            ))}
          </div>
        ) : (
          <img src={users[otherMembers[0]]?.avatar} alt="" className="w-9 h-9 rounded-full bg-gray-200" referrerPolicy="no-referrer" />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{displayName}</h2>
          <p className="text-xs text-text-secondary">{conversation.members.length} members</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-text-secondary">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender === user.id
            const sender = users[msg.sender]
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <img src={sender?.avatar} alt="" className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0 mt-1" referrerPolicy="no-referrer" />
                )}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && conversation.type === 'group' && (
                    <p className="text-xs text-text-secondary mb-0.5 px-1">{sender?.name?.split(' ')[0]}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-gray-100 text-text-primary rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-3 rounded-2xl bg-primary text-white disabled:opacity-30 hover:bg-primary-dark transition cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>
    </div>
  )
}
