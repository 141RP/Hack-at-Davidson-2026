import { useState } from 'react'
import { useApp } from '../context/AppContext'
import UserProfileModal from '../components/UserProfileModal'

export default function Notifications() {
  const { incomingRequests, acceptFriendRequest, denyFriendRequest, users } = useApp()
  const [processing, setProcessing] = useState(null)
  const [viewUser, setViewUser] = useState(null)

  async function handleAccept(req) {
    setProcessing(req.id)
    await acceptFriendRequest(req.id, req.from)
    setProcessing(null)
  }

  async function handleDeny(req) {
    setProcessing(req.id)
    await denyFriendRequest(req.id)
    setProcessing(null)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 md:pt-6 pb-24">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>

      {incomingRequests.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-text-secondary text-sm">No pending friend requests</p>
        </div>
      ) : (
        <div>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Friend Requests ({incomingRequests.length})
          </h2>
          <div className="space-y-2">
            {incomingRequests.map(req => {
              const sender = users[req.from]
              if (!sender) return null
              const isProcessing = processing === req.id
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <button onClick={() => setViewUser(sender)} className="flex-shrink-0 cursor-pointer">
                    <img src={sender.avatar} alt="" className="w-12 h-12 rounded-full bg-gray-200" referrerPolicy="no-referrer" />
                  </button>
                  <button onClick={() => setViewUser(sender)} className="flex-1 min-w-0 text-left cursor-pointer">
                    <p className="text-sm font-semibold truncate">{sender.name}</p>
                    <p className="text-xs text-text-secondary">wants to be your friend</p>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAccept(req)}
                      disabled={isProcessing}
                      className="px-3.5 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50 cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeny(req)}
                      disabled={isProcessing}
                      className="px-3.5 py-2 bg-gray-100 text-text-secondary text-xs font-semibold rounded-xl hover:bg-gray-200 transition disabled:opacity-50 cursor-pointer"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {viewUser && <UserProfileModal userId={viewUser.id} onClose={() => setViewUser(null)} />}
    </div>
  )
}
