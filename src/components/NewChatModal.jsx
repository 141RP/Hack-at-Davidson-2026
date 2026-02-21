import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

export default function NewChatModal({ onClose }) {
  const { createConversation, allUsers, friends, users } = useApp()
  const { user } = useAuth()
  const [groupName, setGroupName] = useState('')
  const [search, setSearch] = useState('')
  const [members, setMembers] = useState([])
  const [creating, setCreating] = useState(false)

  const addedIds = new Set(members.map(m => m.id))
  const friendSet = new Set(friends)

  const availableUsers = useMemo(() => {
    return allUsers.filter(u => u.id !== user.id && !addedIds.has(u.id) && friendSet.has(u.id))
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
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  async function handleCreate() {
    if (members.length === 0) return
    setCreating(true)
    const type = members.length === 1 && !groupName.trim() ? 'dm' : 'group'
    const name = type === 'group' ? (groupName.trim() || 'Group Chat') : ''
    await createConversation(name, type, members.map(m => m.id))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-bold">New Conversation</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {/* Group name */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Spring Break Squad 🌴"
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>

          {/* Added members */}
          {members.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                Added ({members.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 bg-primary/10 rounded-full">
                    <img src={m.avatar} alt="" className="w-6 h-6 rounded-full bg-gray-200" referrerPolicy="no-referrer" />
                    <span className="text-xs font-medium text-primary">{m.name.split(' ')[0]}</span>
                    <button
                      onClick={() => removeMember(m.id)}
                      className="ml-0.5 text-primary/50 hover:text-primary transition cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
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

          {/* User list */}
          <div className="mb-4">
            {!search.trim() && filteredUsers.length > 0 && (
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Your Friends</p>
            )}
            {filteredUsers.length === 0 && (
              <p className="text-sm text-text-secondary text-center py-4">
                {friends.length === 0 ? 'Add friends first to start a chat' : 'No friends found'}
              </p>
            )}
            <div className="space-y-1">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => addMember(u)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 transition text-left cursor-pointer"
                >
                  <img src={u.avatar} alt="" className="w-10 h-10 rounded-full bg-gray-200" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-text-secondary truncate">{u.email}</p>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-3 border-t border-gray-100">
          <button
            onClick={handleCreate}
            disabled={members.length === 0 || creating}
            className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-dark transition disabled:opacity-40 cursor-pointer"
          >
            {creating ? 'Creating...' : members.length === 0 ? 'Add people to start' : `Create Chat${members.length > 1 || groupName.trim() ? ' Group' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
