import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function FriendsListModal({ userId, friendIds, isOwnProfile, onClose }) {
  const { users, removeFriend } = useApp()
  const [removing, setRemoving] = useState(null)

  const friendUsers = friendIds.map(id => users[id]).filter(Boolean)

  async function handleRemove(friendId) {
    setRemoving(friendId)
    await removeFriend(friendId)
    setRemoving(null)
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-lg font-bold">Friends ({friendUsers.length})</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {friendUsers.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-8">No friends yet</p>
          ) : (
            <div className="space-y-1.5">
              {friendUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 transition">
                  <img src={u.avatar} alt="" className="w-10 h-10 rounded-full bg-gray-200" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{u.name}</p>
                    <p className="text-xs text-text-secondary truncate">{u.email}</p>
                  </div>
                  {isOwnProfile && (
                    <button
                      onClick={() => handleRemove(u.id)}
                      disabled={removing === u.id}
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full hover:bg-red-100 transition disabled:opacity-50 cursor-pointer"
                    >
                      {removing === u.id ? '...' : 'Remove'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
