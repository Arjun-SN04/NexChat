import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { LuDownload, LuExternalLink, LuFileText, LuPause, LuPlay, LuX } from 'react-icons/lu'
import { formatBytes } from '../../utils/attachments'

// Full-screen image viewer
const Lightbox = ({ attachment, onClose }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute right-4 top-4 flex gap-2">
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          title="Open original"
          aria-label="Open original"
        >
          <LuExternalLink className="size-4.5" />
        </a>
        <button
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close"
        >
          <LuX className="size-5" />
        </button>
      </div>
      <motion.img
        src={attachment.url}
        alt={attachment.name || 'Photo'}
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
      />
    </motion.div>,
    document.body,
  )
}

const formatDuration = (s = 0) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

// Voice note player. Nothing downloads until you press play (saves bandwidth).
const AudioPlayer = ({ attachment, itsMe }) => {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(attachment.duration || 0)

  const toggle = (e) => {
    e.stopPropagation()
    const a = audioRef.current
    if (a.paused) {
      // Pause any other voice note that's playing
      document.querySelectorAll('audio').forEach((other) => other !== a && other.pause())
      a.play()
    } else a.pause()
  }

  const seek = (e) => {
    e.stopPropagation()
    const a = audioRef.current
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration
    if (a.paused) a.play()
  }

  const progress = duration ? Math.min(100, (current / duration) * 100) : 0

  return (
    <div className="flex w-60 max-w-full items-center gap-3 py-0.5">
      <audio
        ref={audioRef}
        src={attachment.url}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0) }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
        className={`flex size-10 shrink-0 items-center justify-center rounded-full transition ${
          itsMe ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-500'
        }`}
      >
        {playing ? <LuPause className="size-4" /> : <LuPlay className="ml-0.5 size-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <div onClick={seek} className="flex h-6 cursor-pointer items-center" role="slider" aria-label="Seek" aria-valuenow={Math.round(progress)}>
          <div className={`relative h-1 w-full rounded-full ${itsMe ? 'bg-white/30' : 'bg-slate-200 dark:bg-slate-600'}`}>
            <div className={`absolute inset-y-0 left-0 rounded-full ${itsMe ? 'bg-white' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }} />
            <div
              className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${itsMe ? 'bg-white' : 'bg-indigo-600'}`}
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>
        <p className={`text-[11px] tabular-nums ${itsMe ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
          {playing || current ? formatDuration(current) : formatDuration(duration)}
        </p>
      </div>
    </div>
  )
}

// Media / file shown inside a chat bubble.
// Images use the stored (already compressed) file as-is: no Cloudinary
// transformations, so viewing costs only bandwidth. Videos load on play only.
const Attachment = ({ attachment, itsMe }) => {
  const [open, setOpen] = useState(false)
  const { kind, url, name, size, width, height } = attachment
  const ratio = width && height ? `${width} / ${height}` : undefined

  if (kind === 'image') {
    return (
      <>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(true) }}
          className="block overflow-hidden rounded-xl bg-slate-200/60 dark:bg-slate-700/60"
          style={{ aspectRatio: ratio }}
          aria-label="View photo"
        >
          <img
            src={url}
            alt={name || 'Photo'}
            loading="lazy"
            width={width || undefined}
            height={height || undefined}
            className="max-h-80 w-full max-w-xs object-cover"
          />
        </button>
        <AnimatePresence>{open && <Lightbox attachment={attachment} onClose={() => setOpen(false)} />}</AnimatePresence>
      </>
    )
  }

  if (kind === 'audio') return <AudioPlayer attachment={attachment} itsMe={itsMe} />

  if (kind === 'video') {
    return (
      <video
        src={url}
        controls
        preload="none"
        onClick={(e) => e.stopPropagation()}
        className="max-h-80 w-full max-w-xs rounded-xl bg-black"
        style={{ aspectRatio: ratio || '16 / 9' }}
      />
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`flex w-64 max-w-full items-center gap-3 rounded-xl p-2.5 transition ${
        itsMe ? 'bg-white/15 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-700/60 dark:hover:bg-slate-700'
      }`}
    >
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${itsMe ? 'bg-white/20' : 'bg-white text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'}`}>
        <LuFileText className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className={`block text-xs ${itsMe ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>{formatBytes(size)}</span>
      </span>
      <LuDownload className="size-4 shrink-0 opacity-70" />
    </a>
  )
}

export default Attachment
