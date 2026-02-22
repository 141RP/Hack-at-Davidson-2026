import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { DESTINATIONS } from '../data/mockData'

const HERO_DESTINATIONS = DESTINATIONS.slice(0, 12)

function useMouseParallax() {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  useEffect(() => {
    function handleMove(e) {
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      setOffset({ x, y })
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])
  return offset
}

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = Date.now()
        function tick() {
          const elapsed = Date.now() - start
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(eased * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        tick()
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

export default function Login() {
  const { login } = useAuth()
  const parallax = useMouseParallax()
  const [activeCard, setActiveCard] = useState(null)
  const [scrollY, setScrollY] = useState(0)

  const stat1 = useCountUp(DESTINATIONS.length)
  const stat2 = useCountUp(25)
  const stat3 = useCountUp(100)

  useEffect(() => {
    function handleScroll() { setScrollY(window.scrollY) }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [demoIdx, setDemoIdx] = useState(0)
  const [demoDragX, setDemoDragX] = useState(0)
  const [demoIsDragging, setDemoIsDragging] = useState(false)
  const [demoExit, setDemoExit] = useState(null)
  const [demoEntering, setDemoEntering] = useState(false)
  const demoStartX = useRef(0)
  const demoDests = DESTINATIONS.slice(3, 9)
  const demoDest = demoDests[demoIdx % demoDests.length]
  const nextDemoDest = demoDests[(demoIdx + 1) % demoDests.length]

  function demoAdvance() {
    setDemoEntering(true)
    setDemoIdx(prev => prev + 1)
    setDemoDragX(0)
    setDemoExit(null)
    setTimeout(() => setDemoEntering(false), 50)
  }

  function demoPointerDown(e) {
    if (demoExit || demoEntering) return
    setDemoIsDragging(true)
    demoStartX.current = e.clientX
    setDemoExit(null)
  }
  function demoPointerMove(e) {
    if (!demoIsDragging) return
    setDemoDragX(e.clientX - demoStartX.current)
  }
  function demoPointerUp() {
    if (!demoIsDragging) return
    setDemoIsDragging(false)
    if (Math.abs(demoDragX) > 80) {
      setDemoExit(demoDragX > 0 ? 'right' : 'left')
      setTimeout(demoAdvance, 300)
    } else {
      setDemoDragX(0)
    }
  }
  function demoBtnSwipe(dir) {
    if (demoExit || demoEntering) return
    setDemoExit(dir)
    setTimeout(demoAdvance, 300)
  }

  const demoRotation = demoDragX * 0.06
  const demoStampOpacity = Math.min(Math.abs(demoDragX) / 80, 1)
  const ease = 'cubic-bezier(0.22,1,0.36,1)'
  const tAll = `transform 0.4s ${ease}, opacity 0.35s ${ease}`

  let demoCardStyle
  if (demoExit === 'right') {
    demoCardStyle = { transform: 'translateX(150%) translateY(0px) rotate(20deg) scale(1)', opacity: 0, transition: `transform 0.3s ease, opacity 0.25s ease 0.1s` }
  } else if (demoExit === 'left') {
    demoCardStyle = { transform: 'translateX(-150%) translateY(0px) rotate(-20deg) scale(1)', opacity: 0, transition: `transform 0.3s ease, opacity 0.25s ease 0.1s` }
  } else if (demoEntering) {
    demoCardStyle = { transform: 'translateX(0px) translateY(0px) rotate(0deg) scale(1)', opacity: 1, transition: 'none' }
  } else if (demoIsDragging) {
    demoCardStyle = { transform: `translateX(${demoDragX}px) translateY(0px) rotate(${demoRotation}deg) scale(1)`, transition: 'none' }
  } else {
    demoCardStyle = { transform: 'translateX(0px) translateY(0px) rotate(0deg) scale(1)', opacity: 1, transition: tAll }
  }

  const backCardStyle = demoExit
    ? { transform: 'translateX(0px) translateY(0px) scale(1)', opacity: 1, transition: tAll }
    : demoEntering
    ? { transform: 'translateX(0px) translateY(12px) scale(0.94)', opacity: 0, transition: 'none' }
    : { transform: 'translateX(0px) translateY(12px) scale(0.94)', opacity: 0.6, transition: tAll }

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      {/* Sticky nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/90 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/explor-logo.png" alt="EXPLOR" className="h-8" />
          <button
            onClick={login}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${scrollY > 50 ? 'bg-primary text-gray-900 hover:bg-primary-dark' : 'bg-white/90 text-gray-900 hover:bg-white shadow-lg'}`}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-accent" />

        {/* Floating destination cards (background decoration) */}
        <div className="absolute inset-0 overflow-hidden">
          {HERO_DESTINATIONS.slice(0, 6).map((dest, i) => {
            const positions = [
              { top: '8%', left: '5%', rotate: -12 },
              { top: '15%', right: '8%', rotate: 8 },
              { top: '55%', left: '3%', rotate: 6 },
              { top: '60%', right: '5%', rotate: -10 },
              { top: '30%', left: '75%', rotate: 15 },
              { top: '75%', left: '20%', rotate: -8 },
            ]
            const pos = positions[i]
            return (
              <div
                key={dest.id}
                className="absolute w-36 h-48 md:w-44 md:h-56 rounded-2xl overflow-hidden shadow-2xl opacity-30 md:opacity-40"
                style={{
                  ...pos,
                  transform: `translate(${parallax.x * (i % 2 === 0 ? 1 : -1) * 0.5}px, ${parallax.y * (i % 2 === 0 ? -1 : 1) * 0.5}px) rotate(${pos.rotate}deg)`,
                  transition: 'transform 0.3s ease-out',
                }}
              >
                <img src={dest.image} alt="" className="w-full h-full object-cover" />
              </div>
            )
          })}
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <div
            className="mb-8"
            style={{
              transform: `translateY(${parallax.y * -0.3}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <img src="/explor-logo.png" alt="EXPLOR" className="h-20 md:h-28 mx-auto mb-6 drop-shadow-2xl brightness-0 invert" />
            <p className="text-xl md:text-2xl text-white/90 font-medium max-w-xl mx-auto leading-relaxed">
              Plan group trips the fun way. Swipe on destinations, match with friends, and let AI handle the details.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
              onClick={login}
              className="group flex items-center gap-3 bg-white rounded-2xl px-8 py-4 text-base font-bold text-gray-800 hover:shadow-2xl hover:scale-105 transition-all active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Get Started with Google
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white/60">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-amber-700 uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900">
              From <span className="text-primary">swipe</span> to <span className="text-accent">takeoff</span>
            </h2>
            <p className="text-lg text-gray-500 mt-4 max-w-xl mx-auto">
              Three simple steps to your next group adventure
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Swipe Destinations', desc: 'Browse curated locations from around the world. Like the ones that excite you.', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              )},
              { step: '02', title: 'Match with Friends', desc: 'See which destinations your whole group agrees on. No more endless debates.', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              )},
              { step: '03', title: 'Plan & Go', desc: 'Jump into a group chat, let AI build your itinerary, and book your trip.', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )},
            ].map((item, i) => (
              <div
                key={i}
                className="relative group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <span className="text-6xl font-black text-gray-100 absolute top-4 right-6 group-hover:text-primary/20 transition-colors">{item.step}</span>
                <span className="mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Swipe demo */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-amber-700 uppercase tracking-widest mb-3">Try It Out</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900">
              Swipe to discover destinations
            </h2>
            <p className="text-lg text-gray-500 mt-4 max-w-md mx-auto">
              Drag the card or use the buttons. It's that easy.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative w-72 sm:w-80 aspect-[3/4]">
              {/* Next card (peeking behind) */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-lg" style={backCardStyle}>
                <img src={nextDemoDest.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white font-bold text-lg">{nextDemoDest.name}</h3>
                </div>
              </div>

              {/* Active card */}
              <div
                onPointerDown={demoPointerDown}
                onPointerMove={demoPointerMove}
                onPointerUp={demoPointerUp}
                onPointerLeave={() => { if (demoIsDragging) demoPointerUp() }}
                style={{ ...demoCardStyle, touchAction: 'none' }}
                className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing select-none z-10"
              >
                <img src={demoDest.image} alt={demoDest.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {demoDragX > 20 && (
                  <div className="absolute top-8 left-5 border-4 border-green-400 text-green-400 px-4 py-2 rounded-xl text-2xl font-extrabold -rotate-12" style={{ opacity: demoStampOpacity }}>
                    LIKE
                  </div>
                )}
                {demoDragX < -20 && (
                  <div className="absolute top-8 right-5 border-4 border-red-400 text-red-400 px-4 py-2 rounded-xl text-2xl font-extrabold rotate-12" style={{ opacity: demoStampOpacity }}>
                    NOPE
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="text-xl font-bold mb-1">{demoDest.name}</h3>
                  <p className="text-sm text-white/80 line-clamp-2 mb-2">{demoDest.description}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                      {demoDest.rating}
                    </span>
                    <span>{demoDest.price}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Swipe buttons */}
            <div className="flex items-center gap-8 mt-8">
              <button
                onClick={() => demoBtnSwipe('left')}
                className="w-14 h-14 rounded-full bg-white shadow-lg border-2 border-gray-200 flex items-center justify-center text-red-400 hover:scale-110 hover:border-red-300 transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={() => demoBtnSwipe('right')}
                className="w-14 h-14 rounded-full bg-white shadow-lg border-2 border-gray-200 flex items-center justify-center text-green-500 hover:scale-110 hover:border-green-300 transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-4">Drag the card or tap the buttons</p>
          </div>
        </div>
      </section>

      {/* Destination showcase */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-amber-700 uppercase tracking-widest mb-3">Destinations</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900">
              Where will you go next?
            </h2>
            <p className="text-lg text-gray-500 mt-4 max-w-xl mx-auto">
              {DESTINATIONS.length} handpicked destinations across 6 continents
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {HERO_DESTINATIONS.map((dest, i) => (
              <div
                key={dest.id}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
                onMouseEnter={() => setActiveCard(i)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${activeCard === i ? 'opacity-100' : 'opacity-70'}`} />
                <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${activeCard === i ? 'translate-y-0' : 'translate-y-2'}`}>
                  <h3 className="text-white font-bold text-sm md:text-base">{dest.name}</h3>
                  <div className={`overflow-hidden transition-all duration-300 ${activeCard === i ? 'max-h-20 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    <p className="text-white/80 text-xs leading-relaxed line-clamp-2">{dest.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-white/70">
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-400">
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                        {dest.rating}
                      </span>
                      <span>{dest.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            + {DESTINATIONS.length - 12} more destinations to explore
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-gradient-to-br from-accent to-accent-dark">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center text-white">
          <div ref={stat1.ref}>
            <p className="text-4xl md:text-5xl font-black">{stat1.count}+</p>
            <p className="text-sm text-white/70 mt-1 font-medium">Destinations</p>
          </div>
          <div ref={stat2.ref}>
            <p className="text-4xl md:text-5xl font-black">{stat2.count}+</p>
            <p className="text-sm text-white/70 mt-1 font-medium">Countries</p>
          </div>
          <div ref={stat3.ref}>
            <p className="text-4xl md:text-5xl font-black">{stat3.count}%</p>
            <p className="text-sm text-white/70 mt-1 font-medium">Free to Use</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">
            Ready to explore?
          </h2>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
            Sign in, start swiping, and plan your next group trip in minutes — not months.
          </p>
          <button
            onClick={login}
            className="group inline-flex items-center gap-3 bg-primary text-gray-900 rounded-2xl px-10 py-5 text-lg font-bold hover:bg-primary-dark hover:shadow-2xl hover:scale-105 transition-all active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Start Your Adventure
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <img src="/explor-logo.png" alt="EXPLOR" className="h-6 opacity-50" />
          <p className="text-xs text-gray-400">Built for Hack@Davidson 2026</p>
        </div>
      </footer>
    </div>
  )
}
