import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'

/* ─── Animated chat preview ─── */
const BUBBLES = [
  { side: 'left',  avatar: 'S', color: '#6366f1', text: 'Hey! Just signed up here 👋' },
  { side: 'right', avatar: 'Y', color: '#ec4899', text: 'Welcome! It\'s super fast ⚡' },
  { side: 'left',  avatar: 'S', color: '#6366f1', text: 'Real-time messages? Love it' },
  { side: 'right', avatar: 'Y', color: '#ec4899', text: 'Yep — Socket.io magic 🔥' },
]

const ChatPreview = () => {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (count >= BUBBLES.length) return
    const t = setTimeout(() => setCount(c => c + 1), count === 0 ? 600 : 900)
    return () => clearTimeout(t)
  }, [count])

  return (
    <div className="w-full max-w-[340px] rounded-3xl overflow-hidden shadow-2xl"
      style={{ background: '#1e2433', border: '1px solid #2a3347' }}>
      {/* header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: '#2a3347' }}>
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="flex items-center gap-2 ml-2">
          <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">S</div>
          <span className="text-[11px] font-semibold text-slate-300">Sarah</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
        </div>
      </div>
      {/* messages */}
      <div className="px-4 py-4 space-y-2.5 min-h-[180px]">
        {BUBBLES.map((b, i) => (
          <div key={i}
            className={`flex ${b.side === 'right' ? 'justify-end' : 'justify-start'} gap-2 items-end
              transition-all duration-500 ease-out
              ${i < count ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            {b.side === 'left' && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                style={{ background: b.color }}>{b.avatar}</div>
            )}
            <div className={`px-3 py-2 rounded-2xl text-[12px] leading-snug max-w-[75%]
              ${b.side === 'right' ? 'text-white rounded-br-sm' : 'rounded-bl-sm'}`}
              style={b.side === 'right'
                ? { background: '#4f46e5' }
                : { background: '#2a3347', color: '#cbd5e1' }}>
              {b.text}
            </div>
            {b.side === 'right' && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                style={{ background: b.color }}>{b.avatar}</div>
            )}
          </div>
        ))}
        {count < BUBBLES.length && (
          <div className="flex items-center gap-1 pl-8">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        )}
      </div>
      {/* input mock */}
      <div className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: '#2a3347' }}>
        <div className="flex-1 h-7 rounded-lg" style={{ background: '#111827', border: '1px solid #2a3347' }} />
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </div>
      </div>
    </div>
  )
}

/* ─── Stats ─── */
const STATS = [
  { value: '< 50ms', label: 'Message latency' },
  { value: '100%', label: 'Free to use' },
  { value: '∞', label: 'Message history' },
]

/* ─── Features ─── */
const FEATURES = [
  { icon: '⚡', title: 'Instant delivery', desc: 'Socket.io WebSockets push messages in under 50ms.' },
  { icon: '🟢', title: 'Live presence',    desc: 'See exactly who\'s online right now, updated in real-time.' },
  { icon: '✏️', title: 'Edit messages',    desc: 'Fixed a typo? Edit any message you\'ve sent at any time.' },
  { icon: '🗑️', title: 'Delete control',  desc: 'Remove individual messages or clear an entire conversation.' },
  { icon: '🔍', title: 'Live search',      desc: 'Find any contact instantly as you type — no delay.' },
  { icon: '🔒', title: 'Secure auth',      desc: 'JWT tokens in HTTP-only cookies keep sessions safe.' },
]

const HomePage = () => {
  const [AuthUser] = useAuth()

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-5 h-13 flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <span className="font-black text-[15px] text-slate-900 tracking-tight">NexChat</span>
          </div>
          <div className="flex items-center gap-2">
            {AuthUser ? (
              <Link to="/" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-lg transition shadow-sm">
                Open NexChat →
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition">Sign in</Link>
                <Link to="/signup" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-lg transition shadow-sm">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-5xl mx-auto px-5 pt-16 pb-20 grid lg:grid-cols-[1fr_auto] gap-12 items-center">
        <div className="max-w-lg">
          {/* badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold px-3 py-1 rounded-full mb-6 tracking-wide">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            POWERED BY SOCKET.IO · LIVE NOW
          </div>

          <h1 className="text-[52px] font-black leading-[1.06] tracking-tight text-slate-900 mb-4">
            Chat that<br />
            <span className="relative inline-block">
              <span className="text-indigo-600">just works.</span>
              {/* underline squiggle */}
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                <path d="M0 6 Q50 1 100 5 Q150 9 200 4" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
            Clean, fast, real-time messaging with online presence, message editing, and full conversation control.
          </p>

          <div className="flex items-center gap-3 flex-wrap mb-10">
            <Link to={AuthUser ? '/' : '/signup'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[14px] rounded-xl transition shadow-md shadow-indigo-200">
              {AuthUser ? 'Open NexChat' : 'Start for free'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
            {!AuthUser && (
              <Link to="/login"
                className="px-5 py-2.5 text-slate-700 font-semibold text-[14px] border border-slate-200 hover:border-slate-300 rounded-xl bg-white transition shadow-sm">
                Sign in
              </Link>
            )}
          </div>

          {/* stats row */}
          <div className="flex items-center gap-6">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-[18px] font-black text-slate-900 leading-none">{value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat preview */}
        <div className="flex justify-end">
          <ChatPreview />
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="border-t border-slate-100" />

      {/* ── FEATURES ── */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Features</p>
            <h2 className="text-[26px] font-black text-slate-900">Everything you need</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title}
              className="group p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 bg-white">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-lg mb-3 transition">
                {icon}
              </div>
              <h3 className="text-[13px] font-bold text-slate-900 mb-1">{title}</h3>
              <p className="text-[12px] text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STEPS ── */}
      <section className="border-t border-slate-100 bg-slate-50/60">
        <div className="max-w-4xl mx-auto px-5 py-16 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">How it works</p>
          <h2 className="text-[26px] font-black text-slate-900 mb-10">Up and running in 60 seconds</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Create account',  desc: 'Sign up with your name, email and password — takes 30 seconds.' },
              { n: '02', title: 'Find contacts',   desc: 'Search all users instantly. Green dot = online right now.' },
              { n: '03', title: 'Start chatting',  desc: 'Messages delivered instantly. Edit, delete — you\'re in control.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-[13px] mb-3 shadow-md shadow-indigo-200">
                  {n}
                </div>
                <h3 className="font-bold text-[14px] text-slate-900 mb-1.5">{title}</h3>
                <p className="text-[12px] text-slate-500 leading-relaxed max-w-[200px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="relative rounded-3xl overflow-hidden px-8 py-12 md:px-12"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e40af 100%)' }}>
          {/* subtle grid overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-[28px] font-black text-white mb-1.5">Ready to chat?</h2>
              <p className="text-indigo-300 text-[14px]">Free forever. No credit card. No limits.</p>
            </div>
            <Link to={AuthUser ? '/' : '/signup'}
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 font-black text-[14px] rounded-2xl transition hover:bg-indigo-50 shadow-lg">
              {AuthUser ? 'Open NexChat' : 'Create free account'} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 py-5 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} NexChat &nbsp;·&nbsp; React &nbsp;·&nbsp; Socket.io &nbsp;·&nbsp; MongoDB &nbsp;·&nbsp; Made by <span className="font-semibold text-indigo-500">Arjun</span>
        
      </footer>
    </div>
  )
}

export default HomePage
