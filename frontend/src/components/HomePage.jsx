import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import {
  LuArrowRight, LuArrowUpRight, LuBriefcase, LuCheck, LuCheckCheck, LuCookie, LuFingerprint,
  LuGraduationCap, LuHeart, LuKeyRound, LuPencil, LuSearch,
  LuSendHorizontal, LuShieldCheck, LuTrash2, LuUserPlus, LuUsers, LuZap, LuMessagesSquare,
} from 'react-icons/lu'
import { FaGithub } from 'react-icons/fa6'
import { useAuth } from '../context/AuthProvider'
import { Button, Logo, Reveal } from './ui'
import usePageTitle from '../hooks/usePageTitle'

const EASE = [0.22, 1, 0.36, 1]

/* ─── Small building blocks ───────────────────────────────── */
const avatar = (n) => `/images/avatars/${n}.jpg`

const Photo = ({ n, className = 'size-9', online = false, ring = 'ring-2 ring-white' }) => (
  <div className="relative shrink-0">
    <img src={avatar(n)} alt="" loading="lazy" className={`${className} rounded-full object-cover ${ring}`} />
    {online && <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />}
  </div>
)

const AvatarStack = ({ ids, size = 'size-8' }) => (
  <div className="flex -space-x-2.5">
    {ids.map((n) => <Photo key={n} n={n} className={size} />)}
  </div>
)

// Image that drifts slightly slower than the page while scrolling.
const ParallaxImage = ({ src, alt, className = '', distance = 60 }) => {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [-distance, distance])
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.img src={src} alt={alt} loading="lazy" style={{ y, scale: 1.15 }} className={`size-full object-cover ${className}`} />
    </div>
  )
}

const Serif = ({ children, className = '' }) => (
  <span className={`font-display font-normal italic tracking-normal ${className}`}>{children}</span>
)

const Label = ({ children }) => (
  <p className="text-sm font-semibold text-indigo-600">{children}</p>
)

/* ─── Hero background: soft, slowly drifting organic shapes ─ */
const BLOBS = [
  { d: 'M421 309Q398 368 348 404T236 436 124 393 62 288 93 170 197 90 317 86 410 165 421 309Z', cls: '-left-48 -top-40 size-[680px] fill-indigo-200/70', dur: 28, move: { x: [0, 60, 0], y: [0, 40, 0], rotate: [0, 25, 0] } },
  { d: 'M439 297Q416 344 381 384T289 439 182 427 89 366 57 263 95 155 196 76 315 75 410 152 439 297Z', cls: '-right-40 -top-24 size-[620px] fill-violet-200/60', dur: 32, move: { x: [0, -50, 0], y: [0, 60, 0], rotate: [0, -20, 0] } },
  { d: 'M408 322Q376 394 300 424T157 401 71 300 92 172 205 82 337 88 425 182 408 322Z', cls: 'left-1/3 -bottom-56 size-[560px] fill-sky-200/50', dur: 36, move: { x: [0, 40, 0], y: [0, -40, 0], rotate: [0, 30, 0] } },
]

const HeroBackground = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    {BLOBS.map(({ d, cls, dur, move }, i) => (
      <motion.svg
        key={i}
        viewBox="0 0 500 500"
        className={`absolute blur-3xl ${cls}`}
        animate={{ ...move, scale: [1, 1.08, 1] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d={d} />
      </motion.svg>
    ))}
    <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-white" />
  </div>
)

/* ─── Hero visual ─────────────────────────────────────────── */
const HeroChatCard = () => (
  <div className="w-[290px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/20 ring-1 ring-slate-900/5">
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
      <AvatarStack ids={[1, 2, 3]} size="size-7" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">Weekend plans</p>
        <p className="text-xs text-emerald-600">3 online</p>
      </div>
      <LuMessagesSquare className="size-4 text-slate-400" />
    </div>
    <div className="space-y-2.5 bg-slate-50/70 p-4">
      <div className="flex items-end gap-2">
        <Photo n={1} className="size-6" ring="" />
        <p className="rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[13px] text-slate-700 ring-1 ring-slate-200/70">Still coming tonight?</p>
      </div>
      <div className="flex justify-end">
        <p className="rounded-2xl rounded-br-md bg-indigo-600 px-3 py-2 text-[13px] text-white">
          On my way, 10 minutes
          <LuCheckCheck className="ml-1.5 inline size-3.5 text-indigo-200" />
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Photo n={2} className="size-6" ring="" />
        <span className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-3 py-2.5 ring-1 ring-slate-200/70">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 140}ms` }} />
          ))}
        </span>
      </div>
    </div>
  </div>
)

const HeroVisual = () => (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
    className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] ring-1 ring-slate-900/5 lg:aspect-auto lg:h-[min(680px,calc(100dvh-180px))] lg:min-h-[460px]"
  >
    <ParallaxImage src="/images/hero.jpg" alt="Friends laughing together at a message on a phone" distance={30} />
    <div className="absolute inset-0 bg-linear-to-t from-slate-950/30 via-transparent to-transparent" />
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
      className="absolute bottom-5 right-5 hidden sm:block"
    >
      <HeroChatCard />
    </motion.div>
  </motion.div>
)

/* ─── Stats bar ───────────────────────────────────────────── */
const STATS = [
  { value: '<50ms', label: 'Message delivery' },
  { value: 'Live', label: 'Online presence' },
  { value: 'Unlimited', label: 'Message history' },
  { value: '$0', label: 'Free forever' },
]

const StatsBar = () => (
  <section className="border-y border-slate-200/70">
    <div className="mx-auto grid max-w-[1360px] grid-cols-2 md:grid-cols-4">
      {STATS.map(({ value, label }, i) => (
        <div
          key={label}
          className={`px-6 py-10 text-center ${i % 2 === 1 ? 'border-l border-slate-200/70' : ''} ${i >= 2 ? 'border-t border-slate-200/70 md:border-t-0' : ''} ${i === 2 ? 'md:border-l' : ''}`}
        >
          <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  </section>
)

/* ─── Features ────────────────────────────────────────────── */
const LIVE_CHAT = [
  { me: false, n: 3, text: 'Did the build pass?' },
  { me: true, text: 'Yep, all green. Shipping now.' },
  { me: false, n: 3, text: 'Legend. Drinks on me tonight.' },
]

const LiveChatDemo = () => {
  const [count, setCount] = useState(1)
  useEffect(() => {
    const t = setTimeout(() => setCount((c) => (c >= LIVE_CHAT.length + 1 ? 1 : c + 1)), 1600)
    return () => clearTimeout(t)
  }, [count])

  return (
    <div className="flex h-full w-full max-w-md flex-col justify-end gap-2.5">
      <AnimatePresence initial={false}>
        {LIVE_CHAT.slice(0, count).map((m, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className={`flex items-end gap-2 ${m.me ? 'justify-end' : ''}`}
          >
            {!m.me && <Photo n={m.n} className="size-7" ring="" />}
            <div className={`rounded-2xl px-3.5 py-2 text-[13px] ${m.me ? 'rounded-br-md bg-indigo-600 text-white' : 'rounded-bl-md bg-white text-slate-700 ring-1 ring-slate-200/80'}`}>
              {m.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="mt-1 flex items-center gap-2 rounded-xl bg-white p-1.5 pl-3.5 text-[13px] text-slate-400 ring-1 ring-slate-200/80">
        <span className="flex-1">Message Sofia…</span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white"><LuSendHorizontal className="size-4" /></span>
      </div>
    </div>
  )
}

// Card with a light preview panel on top and text below.
const FeatureCard = ({ title, desc, className = '', delay = 0, children }) => (
  <Reveal delay={delay} className={`flex flex-col rounded-3xl border border-slate-200/80 bg-white p-2 transition-shadow duration-300 hover:shadow-lg hover:shadow-slate-900/5 ${className}`}>
    <div className="flex h-64 items-center justify-center overflow-hidden rounded-[1.25rem] bg-slate-50 p-6">{children}</div>
    <div className="px-5 pb-5 pt-6">
      <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{desc}</p>
    </div>
  </Reveal>
)

const ONLINE = [1, 3, 4, 6, 8]

const Features = () => (
  <section id="features" className="py-28">
    <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-10">
      <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <Label>Features</Label>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-5xl">
            Everything a <Serif className="text-indigo-600">great chat</Serif> needs.
          </h2>
        </div>
        <p className="max-w-sm text-slate-500">Fast, focused and built around the way you actually talk. No clutter, just conversation.</p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          className="md:col-span-2"
          title="Real-time messaging"
          desc="Messages travel over WebSockets and arrive in milliseconds. No refreshing, no waiting."
        >
          <LiveChatDemo />
        </FeatureCard>

        <FeatureCard delay={0.06} title="Live presence" desc="See who's online right now, before you hit send.">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="relative">
                <img src={avatar(n)} alt="" loading="lazy" className={`size-12 rounded-full object-cover ring-2 ring-white ${ONLINE.includes(n) ? '' : 'opacity-40 grayscale'}`} />
                {ONLINE.includes(n) && <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />}
              </div>
            ))}
          </div>
        </FeatureCard>

        <FeatureCard delay={0} title="Edit and delete" desc="Fix a typo or take a message back. Changes sync for everyone instantly.">
          <div className="w-full max-w-[240px] space-y-2.5">
            <div className="ml-auto w-fit rounded-2xl rounded-br-md bg-white px-4 py-2 text-[13px] text-slate-400 line-through ring-1 ring-slate-200/80">Meet at 6?</div>
            <div className="ml-auto w-fit rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2 text-[13px] text-white">
              Meet at 7? <span className="ml-1 text-[11px] text-indigo-200">edited</span>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80"><LuPencil className="size-3" /> Edit</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 ring-1 ring-slate-200/80"><LuTrash2 className="size-3" /> Delete</span>
            </div>
          </div>
        </FeatureCard>

        <FeatureCard delay={0.06} title="Instant search" desc="Find anyone in your contacts as you type.">
          <div className="w-full max-w-[280px] rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200/80">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-900">
              <LuSearch className="size-4 text-slate-400" /> So<span className="-ml-1.5 h-4 w-px animate-pulse bg-indigo-600" />
            </div>
            {[[3, 'Sofia Martinez', 'Online'], [5, 'Sophie Laurent', 'Last seen 2h ago']].map(([n, name, status], i) => (
              <div key={name} className={`mt-1 flex items-center gap-3 rounded-xl px-2.5 py-2 ${i === 0 ? 'bg-indigo-50' : ''}`}>
                <Photo n={n} className="size-8" online={i === 0} ring="" />
                <div>
                  <p className="text-[13px] font-medium text-slate-900"><span className="text-indigo-600">So</span>{name.slice(2)}</p>
                  <p className="text-[11px] text-slate-400">{status}</p>
                </div>
              </div>
            ))}
          </div>
        </FeatureCard>

        <FeatureCard delay={0.12} title="Private by default" desc="Secure sessions and hashed passwords keep your account safe.">
          <div className="w-full max-w-[260px] space-y-2">
            {[[LuKeyRound, 'JWT authentication'], [LuCookie, 'HTTP-only cookies'], [LuFingerprint, 'Hashed passwords']].map(([Icon, label]) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-2.5 text-[13px] font-medium text-slate-700 ring-1 ring-slate-200/80">
                <Icon className="size-4 text-indigo-600" /> {label}
                <LuCheck className="ml-auto size-4 text-emerald-600" />
              </div>
            ))}
          </div>
        </FeatureCard>
      </div>
    </div>
  </section>
)

/* ─── Use cases with photos ───────────────────────────────── */
const USE_CASES = [
  { img: '/images/usecase-friends.jpg', Icon: LuHeart, title: 'Friends', desc: 'Plan the trip, share the moment, keep the jokes going.' },
  { img: '/images/usecase-teams.jpg', Icon: LuBriefcase, title: 'Teams', desc: 'Quick decisions without the endless email thread.' },
  { img: '/images/usecase-study.jpg', Icon: LuGraduationCap, title: 'Study groups', desc: 'Share notes and questions the night before the exam.' },
]

const UseCases = () => (
  <section id="use-cases" className="bg-slate-50 py-28">
    <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
      <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-xl">
          <Label>For everyone</Label>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-5xl">
            Made for the people <Serif className="text-indigo-600">you talk to most.</Serif>
          </h2>
        </div>
        <p className="max-w-sm text-slate-500">Whether it's two people or a whole crew, NexChat keeps everyone in the same conversation.</p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {USE_CASES.map(({ img, Icon, title, desc }, i) => (
          <Reveal key={title} delay={i * 0.08}>
            <div className="group relative aspect-[4/5] overflow-hidden rounded-[1.75rem]">
              <ParallaxImage src={img} alt={title} className="transition-transform duration-700 ease-out group-hover:scale-105" />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">{desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
)

/* ─── How it works ────────────────────────────────────────── */
const STEPS = [
  { Icon: LuUserPlus, title: 'Create your account', desc: 'Just a name, email and password. Done in 30 seconds.' },
  { Icon: LuSearch, title: 'Find your people', desc: 'Search contacts instantly and see who is online right now.' },
  { Icon: LuMessagesSquare, title: 'Start talking', desc: 'Send, edit and delete messages in real time.' },
]

const HowItWorks = () => (
  <section id="how-it-works" className="py-28">
    <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Label>How it works</Label>
        <h2 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-5xl">
          From sign-up to <Serif className="text-indigo-600">hello</Serif> in a minute.
        </h2>
      </Reveal>
      <div className="mt-16 grid gap-5 md:grid-cols-3">
        {STEPS.map(({ Icon, title, desc }, i) => (
          <Reveal key={title} delay={i * 0.1}>
            <div className="group h-full rounded-[1.75rem] border border-slate-200/80 bg-white p-8 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/5">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-indigo-600">
                  <Icon className="size-5" />
                </div>
                <span className="font-display text-5xl italic text-slate-200 transition group-hover:text-indigo-200">0{i + 1}</span>
              </div>
              <h3 className="mt-8 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
)

/* ─── CTA ─────────────────────────────────────────────────── */
const CTA_AVATARS = [
  { n: 1, cls: 'left-[6%] top-[18%] size-14' },
  { n: 4, cls: 'left-[14%] bottom-[14%] size-11' },
  { n: 9, cls: 'left-[2%] top-[58%] size-9' },
  { n: 2, cls: 'right-[6%] top-[16%] size-12' },
  { n: 7, cls: 'right-[15%] bottom-[16%] size-14' },
  { n: 6, cls: 'right-[3%] top-[56%] size-9' },
]

const CTA = ({ to, label }) => (
  <section className="px-5 pb-28 sm:px-8">
    <Reveal className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[2.25rem] bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-24 text-center">
      {CTA_AVATARS.map(({ n, cls }, i) => (
        <motion.img
          key={n}
          src={avatar(n)}
          alt=""
          loading="lazy"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5 + i * 0.6, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute hidden rounded-full object-cover ring-4 ring-white/20 lg:block ${cls}`}
        />
      ))}
      <div className="relative">
        <h2 className="mx-auto max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-6xl">
          Your people are <Serif>waiting.</Serif>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-lg text-indigo-100/80">Free forever. No ads, no credit card, no limits.</p>
        <div className="mt-10 flex justify-center">
          <Button to={to} variant="white" size="lg" rightIcon={LuArrowRight} className="rounded-full px-7">{label}</Button>
        </div>
      </div>
    </Reveal>
  </section>
)

/* ─── Footer ──────────────────────────────────────────────── */
const GITHUB_PROFILE = 'https://github.com/Arjun-SN04'
const GITHUB_REPO = 'https://github.com/Arjun-SN04/NexChat'

const FooterLink = ({ href, to, children, external = false }) => {
  const cls = 'group inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900'
  if (to) return <Link to={to} className={cls}>{children}</Link>
  return (
    <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
      {external && <LuArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />}
    </a>
  )
}

const Footer = ({ loggedIn }) => {
  const columns = [
    {
      title: 'Product',
      links: [
        { href: '#features', label: 'Features' },
        { href: '#use-cases', label: 'Use cases' },
        { href: '#how-it-works', label: 'How it works' },
      ],
    },
    {
      title: 'Account',
      links: loggedIn
        ? [{ to: '/', label: 'Open NexChat' }, { to: '/profile', label: 'Profile settings' }]
        : [{ to: '/login', label: 'Sign in' }, { to: '/signup', label: 'Create account' }],
    },
    {
      title: 'Project',
      links: [
        { href: GITHUB_REPO, label: 'Source code', external: true },
        { href: `${GITHUB_REPO}/issues`, label: 'Report an issue', external: true },
        { href: GITHUB_PROFILE, label: 'Developer', external: true },
      ],
    },
  ]

  return (
    <footer className="border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 py-16 lg:grid-cols-[1.6fr_3fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              A clean, fast, real-time messenger for friends, teams and everyone in between.
            </p>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <FaGithub className="size-4" /> View on GitHub
            </a>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {columns.map(({ title, links }) => (
            <div key={title}>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <ul className="mt-5 space-y-3.5">
                {links.map((l) => (
                  <li key={l.label}><FooterLink {...l}>{l.label}</FooterLink></li>
                ))}
              </ul>
            </div>
          ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/70 py-8 sm:flex-row">
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} NexChat. All rights reserved.</p>
          <p className="text-sm text-slate-500">
            Made by{' '}
            <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 underline-offset-4 hover:text-indigo-600 hover:underline">
              Arjun
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ─── Page ────────────────────────────────────────────────── */
const HomePage = () => {
  usePageTitle(null)
  const [AuthUser] = useAuth()
  const [scrolled, setScrolled] = useState(false)

  // Smooth, eased scrolling on the landing page (skipped if the user prefers reduced motion)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09, anchors: true })
    return () => lenis.destroy()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cta = AuthUser ? { to: '/', label: 'Open NexChat' } : { to: '/signup', label: 'Get started for free' }

  return (
    <div className="min-h-dvh overflow-x-clip bg-white text-slate-900">
      {/* Floating nav */}
      <div className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
        <nav
          className={`mx-auto flex h-14 max-w-[1400px] items-center justify-between rounded-full border pl-5 pr-2 transition-all duration-300 ${
            scrolled ? 'border-slate-200/70 bg-white/75 shadow-lg shadow-slate-900/5 backdrop-blur-xl' : 'border-transparent'
          }`}
        >
          <Logo />
          <div className="hidden items-center gap-1 text-sm text-slate-600 md:flex">
            <a href="#features" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-900">How it works</a>
          </div>
          <div className="flex items-center gap-1.5">
            {AuthUser ? (
              <Button to="/" size="sm" rightIcon={LuArrowUpRight} className="h-10 rounded-full px-4">Open app</Button>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm" className="h-10 rounded-full px-4">Sign in</Button>
                <Button to="/signup" variant="dark" size="sm" className="h-10 rounded-full px-4">Get started</Button>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Hero */}
      <header className="relative isolate flex items-center pt-28 pb-16 lg:min-h-dvh lg:pt-24 lg:pb-8">
        <HeroBackground />
        <div className="mx-auto grid w-full max-w-[1360px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-900 sm:text-[60px] xl:text-[72px]">
              Talk to your people, <Serif className="text-indigo-600">instantly.</Serif>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-500">
              A simple, fast messenger with live presence, message editing and instant search.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button to={cta.to} size="lg" rightIcon={LuArrowRight} className="rounded-full px-7">{cta.label}</Button>
              {!AuthUser && <Button to="/login" variant="secondary" size="lg" className="rounded-full px-7">Sign in</Button>}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
              className="mt-10 flex items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <img key={n} src={avatar(n)} alt="" className="size-8 rounded-full object-cover ring-[3px] ring-white sm:size-10" />
                ))}
              </div>
              <div className="text-sm leading-snug">
                <p className="font-semibold text-slate-900">Free for everyone</p>
                <p className="text-slate-500">Friends, teams and study groups</p>
              </div>
            </motion.div>
          </motion.div>

          <HeroVisual />
        </div>
      </header>

      <StatsBar />
      <Features />
      <UseCases />
      <HowItWorks />
      <CTA {...cta} />

      <Footer loggedIn={!!AuthUser} />
    </div>
  )
}

export default HomePage
