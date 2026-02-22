import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { GEMINI_USER_ID } from '../services/gemini'

export default function EditGroupModal({ conversation, onClose }) {
  const { allUsers, users, updateConversationMembers, updateConversationName, friends } = useApp()
  const { user } = useAuth()
  const [name, setName] = useState(conversation.name || '')
  const [members, setMembers] = useState(
    conversation.members
      .filter(id => id !== GEMINI_USER_ID)
      .map(id => users[id] || { id, name: 'Unknown', avatar: '' })
  )
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const addedIds = new Set(members.map(m => m.id))

  const friendSet = new Set(friends)

  const availableUsers = useMemo(() => {
    return allUsers.filter(u =>
      u.id !== user.id && u.id !== GEMINI_USER_ID && !addedIds.has(u.id) && friendSet.has(u.id)
    )
  }, [allUsers, user.id, addedIds, friendSet])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return availableUsers
    const q = search.toLowerCase()
    return availableUsers.filter(u =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    )
  }, [availableUsers, search])

  function addMember(u) {
    setMembers(prev => [...prev, u])
    setSearch('')
  }

  function removeMember(id) {
    if (id === user.id) return
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    const memberIds = [...new Set([...members.map(m => m.id), GEMINI_USER_ID])]
    await updateConversationMembers(conversation.id, memberIds)
    if (name.trim() !== (conversation.name || '')) {
      await updateConversationName(conversation.id, name.trim())
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-bold">Edit Group</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Group name..."
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
              Members ({members.length})
            </label>
            <div className="space-y-1">
              {members.map(m => {
                const isCurrentUser = m.id === user.id
                return (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-gray-50">
                    <img src={m.avatar} alt="" className="w-9 h-9 rounded-full bg-gray-200" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.name}{isCurrentUser ? ' (you)' : ''}
                      </p>
                      <p className="text-xs text-text-secondary truncate">{m.email}</p>
                    </div>
                    {!isCurrentUser && (
                      <button
                        onClick={() => removeMember(m.id)}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent hover:bg-accent/20 transition cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Add People</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-9 pr-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
          </div>

          <div className="mb-4">
            {filteredUsers.length === 0 && search.trim() && (
              <p className="text-sm text-text-secondary text-center py-4">No users found</p>
            )}
            <div className="space-y-1">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => addMember(u)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 transition text-left cursor-pointer"
                >
                  <img src={u.avatar} alt="" className="w-9 h-9 rounded-full bg-gray-200" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-text-secondary truncate">{u.email}</p>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-amber-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 pt-3 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving || members.length === 0}
            className="w-full py-3.5 bg-primary text-gray-900 rounded-2xl font-semibold hover:bg-primary-dark transition disabled:opacity-40 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
