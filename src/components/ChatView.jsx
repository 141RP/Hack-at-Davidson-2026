import { useState, useRef, useEffect, useCallback } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { askGemini, GEMINI_USER_ID } from '../services/gemini'
import EditGroupModal from './EditGroupModal'
import Notepad from './Notepad'

const GEMINI_TRIGGER = /^@gemini\s+/i

export default function ChatView({ conversation, onBack }) {
  const { sendMessage, users, conversations, leaveConversation } = useApp()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showNotepad, setShowNotepad] = useState(false)
  const [notepadEntries, setNotepadEntries] = useState([])
  const bottomRef = useRef(null)

  const liveConv = conversations.find(c => c.id === conversation.id) || conversation
  const isGroup = liveConv.type === 'group'

  const otherMembers = liveConv.members.filter(id => id !== user.id && id !== GEMINI_USER_ID)
  const displayName = isGroup
    ? liveConv.name
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
    if (!isGroup) return
    const q = query(
      collection(db, 'conversations', conversation.id, 'notes'),
      orderBy('time', 'desc'),
    )
    const unsub = onSnapshot(q, (snapshot) => {
      setNotepadEntries(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [conversation.id, isGroup])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const sendGeminiResponse = useCallback(async (question) => {
    setGeminiLoading(true)
    try {
      const recentHistory = messages.slice(-30).map(m => ({
        name: m.sender === GEMINI_USER_ID ? 'Gemini' : (users[m.sender]?.name?.split(' ')[0] || 'User'),
        text: m.text,
      }))
      const notes = notepadEntries.map(n => ({
        title: n.question,
        content: n.answer,
      }))
      const answer = await askGemini(question, recentHistory, notes)
      const now = Date.now()
      await addDoc(collection(db, 'conversations', conversation.id, 'messages'), {
        sender: GEMINI_USER_ID,
        text: answer,
        time: now,
      })
      await updateDoc(doc(db, 'conversations', conversation.id), {
        lastMessageText: answer,
        lastMessageSender: GEMINI_USER_ID,
        lastMessageTime: now,
      })
      await addDoc(collection(db, 'conversations', conversation.id, 'notes'), {
        question,
        answer,
        time: now,
      })
    } catch (err) {
      const now = Date.now()
      await addDoc(collection(db, 'conversations', conversation.id, 'messages'), {
        sender: GEMINI_USER_ID,
        text: "Sorry, I couldn't process that request. Make sure the Gemini API key is configured!",
        time: now,
      })
    }
    setGeminiLoading(false)
  }, [conversation.id, messages, users, notepadEntries])

  async function handleSend(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')

    await sendMessage(conversation.id, trimmed)

    if (GEMINI_TRIGGER.test(trimmed)) {
      const question = trimmed.replace(GEMINI_TRIGGER, '').trim()
      if (question) {
        sendGeminiResponse(question)
      }
    }
  }

  const geminiUser = users[GEMINI_USER_ID]

  const chatPanel = (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <button onClick={onBack} className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        {isGroup ? (
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
          <p className="text-xs text-text-secondary">{liveConv.members.filter(id => id !== GEMINI_USER_ID).length} members</p>
        </div>
        <div className="flex items-center gap-1">
          {isGroup && (
            <>
              <button
                onClick={() => setShowNotepad(!showNotepad)}
                className={`p-2 rounded-xl transition cursor-pointer md:hidden ${showNotepad ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-100 text-text-secondary'}`}
                title="Trip Notepad"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </button>
              <button
                onClick={() => setShowEdit(true)}
                className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-secondary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-xl hover:bg-red-50 transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
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
            <p className="text-xs text-text-secondary mt-1">Try <span className="font-medium text-primary">@Gemini</span> followed by a travel question</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender === user.id
            const isGemini = msg.sender === GEMINI_USER_ID
            const sender = users[msg.sender]
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <img
                    src={sender?.avatar}
                    alt=""
                    className={`w-7 h-7 rounded-full flex-shrink-0 mt-1 ${isGemini ? 'bg-blue-100 p-0.5' : 'bg-gray-200'}`}
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && isGroup && (
                    <p className={`text-xs mb-0.5 px-1 ${isGemini ? 'text-blue-500 font-semibold' : 'text-text-secondary'}`}>
                      {isGemini ? '✨ Gemini' : sender?.name?.split(' ')[0]}
                    </p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-primary text-white rounded-br-md'
                      : isGemini
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-text-primary rounded-bl-md border border-blue-100'
                      : 'bg-gray-100 text-text-primary rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })
        )}

        {geminiLoading && (
          <div className="flex gap-2">
            <img
              src={geminiUser?.avatar}
              alt=""
              className="w-7 h-7 rounded-full bg-blue-100 p-0.5 flex-shrink-0 mt-1"
            />
            <div>
              <p className="text-xs text-blue-500 font-semibold mb-0.5 px-1">✨ Gemini</p>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message... (@Gemini to ask AI)"
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

  return (
    <>
      <div className="fixed inset-0 bottom-16 md:top-16 md:bottom-0 z-40 flex" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Mobile: show either chat or notepad */}
        <div className={`w-full md:hidden ${showNotepad && isGroup ? 'hidden' : 'flex flex-col'}`}>
          {chatPanel}
        </div>
        {showNotepad && isGroup && (
          <div className="w-full md:hidden flex flex-col">
            <Notepad conversationId={conversation.id} onClose={() => setShowNotepad(false)} />
          </div>
        )}

        {/* Desktop: side by side */}
        <div className={`hidden md:flex md:flex-col ${isGroup ? 'md:w-[60%] md:border-r md:border-gray-200' : 'md:w-full'}`}>
          {chatPanel}
        </div>
        {isGroup && (
          <div className="hidden md:flex md:flex-col md:w-[40%]">
            <Notepad conversationId={conversation.id} />
          </div>
        )}
      </div>

      {showEdit && (
        <EditGroupModal conversation={liveConv} onClose={() => setShowEdit(false)} />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">
              {isGroup ? 'Leave Group' : 'Delete Chat'}
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              {isGroup
                ? 'You will be removed from this group. Other members will still see the chat.'
                : 'This chat will be removed from your messages. The other person will still see it.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-text-primary rounded-2xl font-medium hover:bg-gray-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await leaveConversation(conversation.id)
                  onBack()
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600 transition cursor-pointer"
              >
                {isGroup ? 'Leave' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
