import { useState } from 'react'
import { useApp } from '../context/AppContext'
import UserProfileModal from '../components/UserProfileModal'

export default function Notifications() {
  const { incomingRequests, acceptFriendRequest, denyFriendRequest, users, notifications, dismissNotification, destinations } = useApp()
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

  const tripMatchNotifs = notifications.filter(n => n.type === 'trip_match')
  const groupAddedNotifs = notifications.filter(n => n.type === 'group_added')
  const hasAny = incomingRequests.length > 0 || tripMatchNotifs.length > 0 || groupAddedNotifs.length > 0

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 md:pt-6 pb-24">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>

      {!hasAny ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-text-secondary text-sm">No new notifications</p>
        </div>
      ) : (
        <div className="space-y-6">
          {incomingRequests.length > 0 && (
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
                          className="px-3.5 py-2 bg-primary text-gray-900 text-xs font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50 cursor-pointer"
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

          {tripMatchNotifs.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Trip Matches ({tripMatchNotifs.length})
              </h2>
              <div className="space-y-2">
                {tripMatchNotifs.map(notif => {
                  const fromUser = users[notif.fromUserId]
                  const dest = destinations.find(d => d.id === notif.destinationId)
                  if (!fromUser || !dest) return null
                  return (
                    <div key={notif.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                      <div className="relative flex-shrink-0">
                        <img src={dest.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                        <img src={fromUser.avatar} alt="" className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white bg-gray-200" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {fromUser.name?.split(' ')[0]} also liked {dest.name}!
                        </p>
                        <p className="text-xs text-text-secondary">You both want to go here</p>
                      </div>
                      <button
                        onClick={() => dismissNotification(notif.id)}
                        className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer flex-shrink-0"
                        title="Dismiss"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-text-secondary">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {groupAddedNotifs.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Group Chats ({groupAddedNotifs.length})
              </h2>
              <div className="space-y-2">
                {groupAddedNotifs.map(notif => {
                  const fromUser = users[notif.fromUserId]
                  if (!fromUser) return null
                  return (
                    <div key={notif.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                        ✈️
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {fromUser.name?.split(' ')[0]} added you to "{notif.groupName}"
                        </p>
                        <p className="text-xs text-text-secondary">New group chat</p>
                      </div>
                      <button
                        onClick={() => dismissNotification(notif.id)}
                        className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer flex-shrink-0"
                        title="Dismiss"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-text-secondary">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {viewUser && <UserProfileModal userId={viewUser.id} onClose={() => setViewUser(null)} />}
    </div>
  )
}
