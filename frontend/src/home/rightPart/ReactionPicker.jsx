import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { LuPlus, LuSmilePlus } from 'react-icons/lu'
import { MORE_REACTIONS, QUICK_REACTIONS } from '../../utils/messages'
import { FullEmojiPicker } from './EmojiPopover'

// Small emoji popover. Closes on pick, outside click or Esc.
const ReactionPicker = ({ current, onPick, onClose, align = 'right', placement = 'top' }) => {
  const ref = useRef(null)
  const fullRef = useRef(null)
  const [more, setMore] = useState(false)
  const [full, setFull] = useState(false) // every emoji, shown centred on screen

  useEffect(() => {
    const onDown = (e) => !ref.current?.contains(e.target) && !fullRef.current?.contains(e.target) && onClose()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const button = (emoji) => (
    <button
      key={emoji}
      type="button"
      onClick={(e) => { e.stopPropagation(); onPick(emoji) }}
      aria-label={`React with ${emoji}`}
      className={`flex size-9 items-center justify-center rounded-full text-xl transition hover:scale-125 hover:bg-slate-100 dark:hover:bg-slate-700 ${
        current === emoji ? 'bg-indigo-50 ring-1 ring-indigo-300 dark:bg-indigo-500/20 dark:ring-indigo-500/50' : ''
      }`}
    >
      {emoji}
    </button>
  )

  if (full) {
    const width = Math.min(340, window.innerWidth - 32)
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
        <motion.div
          ref={fullRef}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800"
        >
          <FullEmojiPicker onPick={onPick} width={width} autoFocusSearch={window.matchMedia('(pointer: fine)').matches} />
        </motion.div>
      </div>,
      document.body,
    )
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: placement === 'top' ? 6 : -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.14 }}
      onClick={(e) => e.stopPropagation()}
      className={`absolute z-30 rounded-2xl ${placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} bg-white p-1.5 shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      <div className="flex items-center gap-0.5">
        {QUICK_REACTIONS.map(button)}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMore((v) => !v) }}
          aria-label="More reactions"
          aria-expanded={more}
          className="flex size-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <LuPlus className={`size-4 transition-transform ${more ? 'rotate-45' : ''}`} />
        </button>
      </div>
      {more && (
        <div className="mt-1 grid w-[19rem] max-w-[80vw] grid-cols-7 gap-0.5 border-t border-slate-100 pt-1.5 dark:border-slate-700">
          {MORE_REACTIONS.map(button)}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setFull(true) }}
            aria-label="All emojis"
            title="All emojis"
            className="flex size-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
          >
            <LuSmilePlus className="size-5" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default ReactionPicker
