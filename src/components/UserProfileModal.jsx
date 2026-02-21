import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import FriendsListModal from './FriendsListModal'

export default function UserProfileModal({ userId, onClose }) {
  const { users, getUserSwipes, getUserFriends, destinations, swipeResults } = useApp()
  const { user: currentUser } = useAuth()
  const [likedDests, setLikedDests] = useState([])
  const [friendCount, setFriendCount] = useState(0)
  const [friendIds, setFriendIds] = useState([])
  const [loadingSwipes, setLoadingSwipes] = useState(true)
  const [showFriendsList, setShowFriendsList] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const isOwnProfile = userId === currentUser?.id
  const profileUser = users[userId]

  const myLikedIds = useMemo(() => {
    return new Set(
      Object.entries(swipeResults)
        .filter(([, dir]) => dir === 'right')
        .map(([id]) => id)
    )
  }, [swipeResults])

  useEffect(() => {
    if (!userId) return
    getUserSwipes(userId).then(swipes => {
      const liked = Object.entries(swipes)
        .filter(([, dir]) => dir === 'right')
        .map(([id]) => destinations.find(d => d.id === id))
        .filter(Boolean)
      setLikedDests(liked)
      setLoadingSwipes(false)
    })
    getUserFriends(userId).then(ids => {
      setFriendIds(ids)
      setFriendCount(ids.length)
    })
  }, [userId, getUserSwipes, getUserFriends, destinations])

  const sortedDests = useMemo(() => {
    if (isOwnProfile) return likedDests
    return [...likedDests].sort((a, b) => {
      const aCommon = myLikedIds.has(a.id) ? 1 : 0
      const bCommon = myLikedIds.has(b.id) ? 1 : 0
      return bCommon - aCommon
    })
  }, [likedDests, myLikedIds, isOwnProfile])

  const commonCount = useMemo(() => {
    if (isOwnProfile) return 0
    return likedDests.filter(d => myLikedIds.has(d.id)).length
  }, [likedDests, myLikedIds, isOwnProfile])

  const visibleDests = isOwnProfile || showAll ? sortedDests : sortedDests.slice(0, 5)

  if (!profileUser) return null

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="text-lg font-bold">Profile</h2>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex flex-col items-center mb-5">
              <img src={profileUser.avatar} alt="" className="w-20 h-20 rounded-full bg-gray-200 mb-3" referrerPolicy="no-referrer" />
              <h3 className="text-xl font-bold">{profileUser.name}</h3>
              <p className="text-sm text-text-secondary">{profileUser.email}</p>
              <button
                onClick={() => setShowFriendsList(true)}
                className="mt-2 px-4 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-text-secondary hover:bg-gray-200 transition cursor-pointer"
              >
                {friendCount} friend{friendCount !== 1 ? 's' : ''}
              </button>
            </div>

            {profileUser.bio && (
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Bio</h4>
                <p className="text-sm text-text-primary bg-gray-50 rounded-2xl p-3">{profileUser.bio}</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Liked Destinations ({likedDests.length})
                </h4>
                {!isOwnProfile && commonCount > 0 && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {commonCount} in common
                  </span>
                )}
              </div>
              {loadingSwipes ? (
                <p className="text-sm text-text-secondary text-center py-4">Loading...</p>
              ) : likedDests.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-4">No liked destinations yet</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {visibleDests.map(dest => {
                      const isCommon = !isOwnProfile && myLikedIds.has(dest.id)
                      return (
                        <div key={dest.id} className={`flex items-center gap-3 p-2.5 rounded-2xl ${isCommon ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-gray-50'}`}>
                          <img src={dest.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold truncate">{dest.name}</p>
                              {isCommon && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-primary flex-shrink-0">
                                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary">{dest.price}</p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-yellow-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                            {dest.rating}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {!isOwnProfile && sortedDests.length > 5 && (
                    <button
                      onClick={() => setShowAll(prev => !prev)}
                      className="w-full mt-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-2xl transition cursor-pointer"
                    >
                      {showAll ? 'Show Less' : `Show All (${sortedDests.length})`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showFriendsList && (
        <FriendsListModal
          userId={userId}
          friendIds={friendIds}
          isOwnProfile={userId === currentUser?.id}
          onClose={() => setShowFriendsList(false)}
        />
      )}
    </>
  )
}
