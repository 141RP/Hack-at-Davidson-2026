import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { GEMINI_USER_ID } from '../services/gemini'
import UserProfileModal from '../components/UserProfileModal'

export default function Friends() {
  const { allUsers, friends, sentRequests, sendFriendRequest, users } = useApp()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(null)
  const [viewUser, setViewUser] = useState(null)

  const sentToIds = useMemo(() => new Set(sentRequests.map(r => r.to)), [sentRequests])
  const friendSet = useMemo(() => new Set(friends), [friends])

  const searchableUsers = useMemo(() => {
    return allUsers.filter(u => u.id !== user.id && u.id !== GEMINI_USER_ID)
  }, [allUsers, user.id])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return searchableUsers.filter(u =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    )
  }, [searchableUsers, search])

  const friendsList = useMemo(() => {
    return friends.map(id => users[id]).filter(Boolean)
  }, [friends, users])

  const suggestions = useMemo(() => {
    const nonFriends = searchableUsers.filter(u =>
      !friendSet.has(u.id) && !sentToIds.has(u.id)
    )
    const mutualCounts = new Map()
    for (const u of nonFriends) {
      const theirFriends = users[u.id]?.friends || []
      const mutuals = theirFriends.filter(id => friendSet.has(id)).length
      mutualCounts.set(u.id, mutuals)
    }
    const sorted = [...nonFriends].sort((a, b) => {
      return (mutualCounts.get(b.id) || 0) - (mutualCounts.get(a.id) || 0)
    })
    return sorted.slice(0, 5).map(u => ({
      ...u,
      mutualCount: mutualCounts.get(u.id) || 0,
    }))
  }, [searchableUsers, friendSet, sentToIds, users])

  async function handleAdd(targetId) {
    setSending(targetId)
    await sendFriendRequest(targetId)
    setSending(null)
  }

  function getRelationship(uid) {
    if (friendSet.has(uid)) return 'friends'
    if (sentToIds.has(uid)) return 'pending'
    return 'none'
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 md:pt-6 pb-24">
      <h1 className="text-2xl font-bold mb-4">Friends</h1>

      <div className="relative mb-6">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search for people by name..."
          className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl text-sm shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
        />
      </div>

      {search.trim() ? (
        <div>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Search Results</h2>
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-8">No users found matching "{search}"</p>
          ) : (
            <div className="space-y-1.5">
              {filteredUsers.map(u => {
                const rel = getRelationship(u.id)
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100"
                  >
                    <button onClick={() => setViewUser(u)} className="flex-shrink-0 cursor-pointer">
                      <img src={u.avatar} alt="" className="w-11 h-11 rounded-full bg-gray-200" referrerPolicy="no-referrer" />
                    </button>
                    <button onClick={() => setViewUser(u)} className="flex-1 min-w-0 text-left cursor-pointer">
                      <p className="text-sm font-semibold truncate">{u.name}</p>
                      <p className="text-xs text-text-secondary truncate">{u.email}</p>
                    </button>
                    {rel === 'friends' ? (
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Friends</span>
                    ) : rel === 'pending' ? (
                      <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Pending</span>
                    ) : (
                      <button
                        onClick={() => handleAdd(u.id)}
                        disabled={sending === u.id}
                        className="px-3 py-1.5 bg-primary text-gray-900 text-xs font-semibold rounded-full hover:bg-primary-dark transition disabled:opacity-50 cursor-pointer"
                      >
                        {sending === u.id ? '...' : 'Add Friend'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          {suggestions.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">People You May Know</h2>
              <div className="space-y-1.5">
                {suggestions.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100"
                  >
                    <button onClick={() => setViewUser(u)} className="flex-shrink-0 cursor-pointer">
                      <img src={u.avatar} alt="" className="w-11 h-11 rounded-full bg-gray-200" referrerPolicy="no-referrer" />
                    </button>
                    <button onClick={() => setViewUser(u)} className="flex-1 min-w-0 text-left cursor-pointer">
                      <p className="text-sm font-semibold truncate">{u.name}</p>
                      {u.mutualCount > 0 ? (
                        <p className="text-xs text-amber-700 font-medium">{u.mutualCount} mutual friend{u.mutualCount !== 1 ? 's' : ''}</p>
                      ) : (
                        <p className="text-xs text-text-secondary truncate">{u.email}</p>
                      )}
                    </button>
                    <button
                      onClick={() => handleAdd(u.id)}
                      disabled={sending === u.id}
                      className="px-3 py-1.5 bg-primary text-gray-900 text-xs font-semibold rounded-full hover:bg-primary-dark transition disabled:opacity-50 cursor-pointer"
                    >
                      {sending === u.id ? '...' : 'Add Friend'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Your Friends ({friendsList.length})
          </h2>
          {friendsList.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">👋</div>
              <p className="text-text-secondary text-sm">No friends yet. Add people above or search by name!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {friendsList.map(u => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100"
                >
                  <button onClick={() => setViewUser(u)} className="flex-shrink-0 cursor-pointer">
                    <img src={u.avatar} alt="" className="w-11 h-11 rounded-full bg-gray-200" referrerPolicy="no-referrer" />
                  </button>
                  <button onClick={() => setViewUser(u)} className="flex-1 min-w-0 text-left cursor-pointer">
                    <p className="text-sm font-semibold truncate">{u.name}</p>
                    <p className="text-xs text-text-secondary truncate">{u.email}</p>
                  </button>
                  <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Friends</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewUser && <UserProfileModal userId={viewUser.id} onClose={() => setViewUser(null)} />}
    </div>
  )
}
