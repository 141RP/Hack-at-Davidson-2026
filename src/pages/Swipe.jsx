import { useState, useRef, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'

export default function Swipe() {
  const { currentDestination, swipe, currentDestIdx, totalDestinations, swipeResults, destinations, friends, users, getUserSwipes } = useApp()
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exitDirection, setExitDirection] = useState(null)
  const startX = useRef(0)
  const [friendSwipes, setFriendSwipes] = useState({})
  const loadedFriends = useRef(new Set())

  useEffect(() => {
    for (const fid of friends) {
      if (!loadedFriends.current.has(fid)) {
        loadedFriends.current.add(fid)
        getUserSwipes(fid).then(swipes => {
          setFriendSwipes(prev => ({ ...prev, [fid]: swipes }))
        })
      }
    }
  }, [friends, getUserSwipes])

  const unlikedDests = useMemo(() => {
    return destinations.filter(d => swipeResults[d.id] === 'left')
  }, [destinations, swipeResults])

  const [recycleIdx, setRecycleIdx] = useState(0)

  const showRecycled = !currentDestination && unlikedDests.length > 0
  const displayDest = currentDestination || (showRecycled ? unlikedDests[recycleIdx % unlikedDests.length] : null)

  const friendsWhoLiked = useMemo(() => {
    if (!displayDest) return []
    return friends
      .filter(fid => friendSwipes[fid]?.[displayDest.id] === 'right')
      .map(fid => users[fid]?.name?.split(' ')[0])
      .filter(Boolean)
  }, [displayDest, friends, friendSwipes, users])

  if (!displayDest) {
    const rightSwipes = Object.entries(swipeResults).filter(([, dir]) => dir === 'right')
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
        <p className="text-text-secondary mb-6">You've swiped through all destinations</p>
        {rightSwipes.length > 0 && (
          <div className="text-left">
            <h3 className="font-semibold text-lg mb-3">Your picks:</h3>
            <div className="space-y-2">
              {rightSwipes.map(([destId]) => {
                const dest = destinations.find(d => d.id === destId)
                return dest ? (
                  <div key={destId} className="flex items-center gap-3 p-3 bg-success/10 rounded-2xl">
                    <img src={dest.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    <span className="font-medium text-sm">{dest.name}</span>
                    <span className="ml-auto text-success text-lg">✓</span>
                  </div>
                ) : null
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  function handlePointerDown(e) {
    setIsDragging(true)
    startX.current = e.clientX
    setExitDirection(null)
  }

  function handlePointerMove(e) {
    if (!isDragging) return
    setDragX(e.clientX - startX.current)
  }

  function handlePointerUp() {
    if (!isDragging) return
    setIsDragging(false)
    if (Math.abs(dragX) > 100) {
      const dir = dragX > 0 ? 'right' : 'left'
      setExitDirection(dir)
      setTimeout(() => {
        swipe(displayDest.id, dir)
        if (showRecycled) setRecycleIdx(prev => prev + 1)
        setDragX(0)
        setExitDirection(null)
      }, 300)
    } else {
      setDragX(0)
    }
  }

  function handleButtonSwipe(dir) {
    setExitDirection(dir)
    setTimeout(() => {
      swipe(displayDest.id, dir)
      if (showRecycled) setRecycleIdx(prev => prev + 1)
      setDragX(0)
      setExitDirection(null)
    }, 300)
  }

  const rotation = dragX * 0.05
  const opacity = Math.min(Math.abs(dragX) / 100, 1)
  const exitTransform = exitDirection === 'right'
    ? 'translateX(150%) rotate(20deg)'
    : exitDirection === 'left'
    ? 'translateX(-150%) rotate(-20deg)'
    : `translateX(${dragX}px) rotate(${rotation}deg)`

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 md:pt-6 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Explore</h1>
        <span className="text-sm text-text-secondary">
          {showRecycled ? 'Previously passed' : `${currentDestIdx + 1} / ${totalDestinations}`}
        </span>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { if (isDragging) handlePointerUp() }}
        style={{
          transform: exitTransform,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          touchAction: 'none',
        }}
        className="relative w-full aspect-[3/4] max-h-[65vh] rounded-3xl overflow-hidden shadow-xl cursor-grab active:cursor-grabbing select-none"
      >
        <img
          src={displayDest.image}
          alt={displayDest.name}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {dragX > 30 && (
          <div className="absolute top-8 left-6 border-4 border-success text-success px-4 py-2 rounded-xl text-2xl font-extrabold -rotate-12" style={{ opacity }}>
            LIKE
          </div>
        )}
        {dragX < -30 && (
          <div className="absolute top-8 right-6 border-4 border-accent text-accent px-4 py-2 rounded-xl text-2xl font-extrabold rotate-12" style={{ opacity }}>
            NOPE
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <h2 className="text-2xl font-bold mb-1">{displayDest.name}</h2>
          <p className="text-sm text-white/80 mb-3 line-clamp-2">{displayDest.description}</p>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {displayDest.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
              {displayDest.rating}
            </span>
            <span>{displayDest.price}</span>
            <span>{displayDest.duration}</span>
            {friendsWhoLiked.length > 0 && (
              <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-pink-300">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
                {friendsWhoLiked.length === 1
                  ? `Liked by ${friendsWhoLiked[0]}`
                  : `Liked by ${friendsWhoLiked[0]} & ${friendsWhoLiked[1]}`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-6">
        <button
          onClick={() => handleButtonSwipe('left')}
          className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-gray-200 flex items-center justify-center text-accent hover:scale-110 hover:border-accent transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={() => handleButtonSwipe('right')}
          className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-gray-200 flex items-center justify-center text-success hover:scale-110 hover:border-success transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
