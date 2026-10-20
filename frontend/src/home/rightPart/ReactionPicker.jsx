import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { LuPlus } from 'react-icons/lu'
import { MORE_REACTIONS, QUICK_REACTIONS } from '../../utils/messages'

// Small emoji popover. Closes on pick, outside click or Esc.
const ReactionPicker = ({ current, onPick, onClose, align = 'right', placement = 'top' }) => {
  const ref = useRef(null)
  const [more, setMore] = useState(false)

  useEffect(() => {
    const onDown = (e) => !ref.current?.contains(e.target) && onClose()
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
        </div>
      )}
    </motion.div>
  )
}

export default ReactionPicker
