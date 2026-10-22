import React, { Suspense, lazy, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { LuLoaderCircle } from 'react-icons/lu'
import { useTheme } from '../../context/ThemeProvider'

// The picker is big, so it's only downloaded the first time someone opens it
const EmojiPicker = lazy(() => import('emoji-picker-react'))

const WIDTH = 340
const HEIGHT = 400

// The full picker with our settings; used by the message box and by reactions
export const FullEmojiPicker = ({ onPick, width, height = HEIGHT, autoFocusSearch = false }) => {
  const { dark } = useTheme()
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center bg-white dark:bg-slate-900" style={{ width, height }}>
          <LuLoaderCircle className="size-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <EmojiPicker
        onEmojiClick={(data) => onPick(data.emoji)}
        theme={dark ? 'dark' : 'light'}
        emojiStyle="native"
        lazyLoadEmojis
        autoFocusSearch={autoFocusSearch}
        searchPlaceholder="Search emoji"
        previewConfig={{ showPreview: false }}
        width={width}
        height={height}
        style={{ border: 'none', borderRadius: 0 }}
      />
    </Suspense>
  )
}

// Full emoji picker (search, categories, skin tones) above the message box.
// Stays open so you can add several; closes on outside click or Esc.
// `toggleRef` is the button that opens it, so clicking it again doesn't reopen.
const EmojiPopover = ({ onPick, onClose, toggleRef }) => {
  const ref = useRef(null)
  const width = Math.min(WIDTH, window.innerWidth - 32)

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current?.contains(e.target) || toggleRef.current?.contains(e.target)) return
      onClose()
    }
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, toggleRef])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full left-4 z-30 mb-2 origin-bottom-left overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200 sm:left-6 lg:left-8 dark:ring-slate-800"
      style={{ width, height: HEIGHT }}
    >
      <FullEmojiPicker onPick={onPick} width={width} autoFocusSearch={window.matchMedia('(pointer: fine)').matches} />
    </motion.div>
  )
}

export default EmojiPopover
