import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'

export default function Profile() {
  const { user, logout } = useAuth()
  const { swipeResults, destinations, conversations } = useApp()

  const rightSwipes = Object.entries(swipeResults).filter(([, dir]) => dir === 'right')
  const leftSwipes = Object.entries(swipeResults).filter(([, dir]) => dir === 'left')
  const groupChats = conversations.filter(c => c.type === 'group')

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 md:pt-6 pb-24">
      <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 text-white mb-6">
        <div className="flex items-center gap-4">
          <img src={user.avatar} alt="" className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30" referrerPolicy="no-referrer" />
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-white/70 text-sm">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold">{rightSwipes.length}</p>
            <p className="text-xs text-white/70">Liked</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold">{leftSwipes.length}</p>
            <p className="text-xs text-white/70">Passed</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold">{groupChats.length}</p>
            <p className="text-xs text-white/70">Groups</p>
          </div>
        </div>
      </div>

      {rightSwipes.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-3">Liked Destinations</h2>
          <div className="space-y-2">
            {rightSwipes.map(([destId]) => {
              const dest = destinations.find(d => d.id === destId)
              if (!dest) return null
              return (
                <div key={destId} className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <img src={dest.image} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{dest.name}</h3>
                    <p className="text-xs text-text-secondary">{dest.price} · {dest.duration}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    {dest.rating}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {groupChats.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-3">Your Trip Groups</h2>
          <div className="space-y-2">
            {groupChats.map(chat => (
              <div key={chat.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">✈️</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{chat.name || 'Group Chat'}</h3>
                  <p className="text-xs text-text-secondary">{chat.members.length} members</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="font-semibold text-lg mb-3">Settings</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-secondary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="text-sm">Notifications</span>
          </button>
          <div className="border-t border-gray-100" />
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-secondary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span className="text-sm">Privacy</span>
          </button>
          <div className="border-t border-gray-100" />
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span className="text-sm text-accent">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
